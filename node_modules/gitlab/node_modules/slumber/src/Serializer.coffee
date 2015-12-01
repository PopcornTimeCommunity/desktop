debug = require('debug') 'slumber:Serializer'

class BaseSerializer
  content_types: null
  key: null

  constructor: ->
    @debug = require('debug') "slumber:#{@constructor.name}"
    @debug 'constructor'

  get_content_type: =>
    unless @content_types?
      throw 'Not Implemented'
    return @content_types[0]

  loads: (data) =>
    throw 'Not Implemented'

  dumps: (data) =>
    throw 'Not Implemented'

SERIALIZERS = module.exports.SERIALIZERS = {}

class JsonSerializer extends BaseSerializer
  content_types: [
    'application/json'
    'application/x-javascript'
    'text/javascript'
    'text/x-javascript'
    'text/x-json'
    ]
  key: 'json'

  loads: (data) =>
    return JSON.parse data

  dumps: (data) =>
    return JSON.stringify data

SERIALIZERS.json = JsonSerializer

try
  yamljs = require 'yamljs'
  class YamlSerializer extends BaseSerializer
    content_types: [
      'text/yaml'
      ]
    key: 'yaml'

    loads: (data) =>
      return yamljs.parse data

    dumps: (data) =>
      return yamljs.stringify data

  SERIALIZERS.yaml = YamlSerializer


class module.exports.Serializer
  constructor: (@default='json', serializers=null) ->
    debug 'constructor', "@default=#{@default}", "serializers=#{serializers}"
    unless serializers?
      serializers = [new obj for key, obj of SERIALIZERS][0]

    unless serializers
      throw 'There are no available serializers.'

    @serializers = {}
    for serializer in serializers
      @serializers[serializer.key] = serializer

  get_serializer: (name=null, content_type=null) =>
    if name is null and content_type is null
      return @serializers[@default]

    if name?
      if not @serializers[name]?
        throw "#{name} is not an available serializer"
      return @serializers[name]

    if content_type?
      for serializer_name, serializer of @serializers
        for ctype in serializer.content_types
          return serializer if content_type == ctype
      throw "there is no available serializer for content-type #{content_type}"

  loads: (data, format=null) =>
    s = @get_serializer format
    return s.loads data

  dumps: (data, format=null) =>
    s = @get_serializer format
    return s.dumps data

  get_content_type: (format=null) =>
    s = @get_serializer format
    return s.get_content_type()
