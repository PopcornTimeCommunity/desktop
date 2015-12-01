var http = require('http');
var et = require('elementtree');
var parseUrl = require('url').parse;

function DeviceClient(url) {
  this.url = url;
  this.deviceDescription = null;
  this.serviceDescriptions = {};
}

DeviceClient.prototype.getDeviceDescription = function(callback) {
  var self = this;

  // Use cache if available
  if(this.deviceDescription) {
    process.nextTick(function() {
      callback(null, self.deviceDescription);
    });
    return;
  }

  fetchDeviceDescription(this.url, function(err, desc) {
    if(err) return callback(err);
    self.deviceDescription = desc; // Store in cache for next call
    callback(null, desc);
  });
};

DeviceClient.prototype.getServiceDescription = function(serviceId, callback) {
  var self = this;
  var serviceId = (serviceId.indexOf(':') === -1) 
    ? 'urn:upnp-org:serviceId:' + serviceId 
    : serviceId;

  this.getDeviceDescription(function(err, desc) {
    if(err) return callback(err);

    var service = desc.services[serviceId];
    if(!service) {
      var err = new Error('Service ' + serviceId + ' not provided by device');
      err.code = 'ENOSERVICE';
      return callback(err);
    }

    // Use cache if available
    if(self.serviceDescriptions[serviceId]) {
      return callback(null, self.serviceDescriptions[serviceId]);
    }

    fetchServiceDescription(service.SCPDURL, function(err, desc) {
      if(err) return callback(err);
      self.serviceDescriptions[serviceId] = desc; // Store in cache for next call
      callback(null, desc);
    });
  });
};

DeviceClient.prototype.callAction = function(serviceId, actionName, params, callback) {
  var self = this;
  var serviceId = (serviceId.indexOf(':') === -1) 
    ? 'urn:upnp-org:serviceId:' + serviceId 
    : serviceId;

  this.getServiceDescription(serviceId, function(err, desc) {
    if(err) return callback(err);

    if(!desc.actions[actionName]) {
      var err = new Error('Action ' + actionName + ' not implemented by service');
      err.code = 'ENOACTION';
      return callback(err);
    }

    var service = self.deviceDescription.services[serviceId];

    // Build SOAP action body
    var envelope = et.Element('s:Envelope');
    envelope.set('xmlns:s', 'http://schemas.xmlsoap.org/soap/envelope/');
    envelope.set('s:encodingStyle', 'http://schemas.xmlsoap.org/soap/encoding/');

    var body = et.SubElement(envelope, 's:Body');
    var action = et.SubElement(body, 'u:' + actionName);
    action.set('xmlns:u', service.serviceType);

    Object.keys(params).forEach(function(paramName) {
      var tmp = et.SubElement(action, paramName);
      var value = params[paramName];
      tmp.text = (value === null)
        ? '' 
        : params[paramName].toString();
    });

    var doc = new et.ElementTree(envelope);
    var xml = doc.write({ 
      xml_declaration: true,
    });

    // Send action request
    var parsed = parseUrl(service.controlURL);

    var options = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.path,
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset="utf-8"',
        'Content-Length': xml.length,
        'Connection': 'close',
        'SOAPACTION': '"' + service.serviceType + '#' + actionName + '"'
      }
    }

    var req = http.request(options, function(res) {
      var chunks = [];

      res.on('data', function(chunk) {
        chunks.push(chunk);
      });

      res.on('end', function() {
        var buf = Buffer.concat(chunks);
        var doc = et.parse(buf.toString());

        if(res.statusCode !== 200) {
          var errorCode = doc.findtext('.//errorCode');
          var errorDescription = doc.findtext('.//errorDescription').trim();

          var err = new Error(errorDescription + ' (' + errorCode + ')');
          err.code = 'EUPNP';
          err.statusCode = res.statusCode;
          err.errorCode = errorCode;
          return callback(err);
        }

        // Extract response outputs
        var serviceDesc = self.serviceDescriptions[serviceId];
        var actionDesc = serviceDesc.actions[actionName];
        var outputs = actionDesc.outputs.map(function(desc) {
          return desc.name;
        });

        var result = {};
        outputs.forEach(function(name) {
          result[name] = doc.findtext('.//' + name);
        });

        callback(null, result)
      });
    });

    req.on('error', callback);
    req.end(xml);
  });
};


function fetchDeviceDescription(url, callback) {
  fetch(url, function(err, body) {
    if(err) return callback(err);

    var doc = et.parse(body);

    var desc = extractFields(doc.find('./device'), [
      'deviceType', 
      'friendlyName', 
      'manufacturer', 
      'manufacturerURL', 
      'modelName', 
      'modelNumber', 
      'UDN'
    ]);

    var nodes = doc.findall('./device/iconList/icon');
    desc.icons = nodes.map(function(icon) {
      return extractFields(icon, [
        'mimetype',
        'width',
        'height',
        'depth',
        'url'
      ]);
    });

    var nodes = doc.findall('./device/serviceList/service');
    desc.services = {};
    nodes.forEach(function(service) {
      var tmp = extractFields(service, [
        'serviceType',
        'serviceId',
        'SCPDURL',
        'controlURL',
        'eventSubURL'
      ]);

      var id = tmp.serviceId;
      delete tmp.serviceId;
      desc.services[id] = tmp;
    });

    // Make URLs absolute
    var baseUrl = extractBaseUrl(url);

    desc.icons.map(function(icon) {
      icon.url = buildAbsoluteUrl(baseUrl, icon.url);
      return icon;
    });

    Object.keys(desc.services).forEach(function(id) {
      var service = desc.services[id];
      service.SCPDURL = buildAbsoluteUrl(baseUrl, service.SCPDURL);
      service.controlURL = buildAbsoluteUrl(baseUrl, service.controlURL);
      service.eventSubURL = buildAbsoluteUrl(baseUrl, service.eventSubURL);
    });

    callback(null, desc);
  });
}

function fetchServiceDescription(url, callback) {
  fetch(url, function(err, body) {
    if(err) return callback(err);

    var doc = et.parse(body);

    var desc = {};

    desc.actions = {};
    var nodes = doc.findall('./actionList/action');
    nodes.forEach(function(action) {
      var name = action.findtext('./name');
      var inputs = [];
      var outputs = [];

      var nodes = action.findall('./argumentList/argument');
      nodes.forEach(function(argument) {
        var arg = extractFields(argument, [
          'name',
          'direction',
          'relatedStateVariable'
        ]);

        var direction = arg.direction;
        delete arg.direction;

        if(direction === 'in') inputs.push(arg);
        else outputs.push(arg);
      });

      desc.actions[name] = {
        inputs: inputs,
        outputs: outputs
      };
    });

    desc.stateVariables = {};
    var nodes = doc.findall('./serviceStateTable/stateVariable');
    nodes.forEach(function(stateVariable) {
      var name = stateVariable.findtext('./name');

      var nodes = stateVariable.findall('./allowedValueList/allowedValue');
      var allowedValues = nodes.map(function(allowedValue) {
        return allowedValue.text;
      });

      desc.stateVariables[name] = {
        dataType: stateVariable.findtext('./dataType'),
        sendEvents: stateVariable.get('sendEvents'),
        allowedValues: allowedValues,
        defaultValue: stateVariable.findtext('./defaultValue')
      };
    });

    callback(null, desc);
  });
}

function fetch(url, callback) {
  var req = http.get(url, function(res) {
    var chunks = [];

    res.on('data', function(chunk) {
      chunks.push(chunk);
    });

    res.on('end', function() {
      var buf = Buffer.concat(chunks);
      callback(null, buf.toString())
    });
  });

  req.on('error', callback);
  req.end();
}

function extractFields(node, fields) {
  var data = {};
  fields.forEach(function(field) {
    data[field] = node.findtext('./' + field);
  });
  return data;
}

function buildAbsoluteUrl(base, url) {
  if(url === '') return '';
  if(url.substring(0, 4) === 'http') return url;
  if(url[0] === '/') {
    var root = base.split('/').slice(0, 3).join('/'); // http://host:port
    return root + url;
  } else {
    return base + '/' + url;
  }
}

function extractBaseUrl(url) {
  return url.split('/').slice(0, -1).join('/');
}

module.exports = DeviceClient;
