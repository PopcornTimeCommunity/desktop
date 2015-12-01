querystring = require 'querystring'
debug = require('debug') 'slumber:api'
{callable, append_slash, merge, hasInsensitive} = require './utils'
request = require 'request'
{Serializer} = require './Serializer'

API = callable class
  constructor: (base_url, @opts={}, fn=null) ->
    #debug "constructor base_url=#{base_url}"

    if base_url?
      @opts.base_url = base_url
    @opts.append_slash ?= true
    #@opts.session ?= null
    @opts.auth ?= null
    @opts.request_opts ?=
      rejectUnauthorized: false

    @opts.format ?= 'json'
    @serializer = @opts.serializer ?= new Serializer @opts.format

    if @opts.append_slash
      @opts.base_url = append_slash @opts.base_url
    @base_url = @opts.base_url

    unless @opts.base_url
      throw "base_url is required"

    #unless session
      # handle auth

    process.nextTick -> fn @ if fn
    return @

  _create_child: (path) =>
    new_base_url = "#{append_slash @base_url}#{path}"

    callable_api = API
    child = new callable_api new_base_url, @opts
    return child

  _try_to_serialize: (response, body) =>
    if response.headers['content-type']?
      content_type = response.headers['content-type'].split(';')[0].replace(/^\s*|\s*$/g, '')

      try
        stype = @serializer.get_serializer null, content_type
      catch e
        return body

      return stype.loads body

    return body

  _construct_request: (method, kwargs) =>
    request_options =
      url: @base_url
      method: method
      headers: {}

    if @opts.headers?
      request_options.headers = merge request_options.headers, @opts.headers

    if kwargs.headers?
      request_options.headers = merge request_options.headers, kwargs.headers

    for key, value of @opts.request_opts
      request_options[key] = value unless request_options[key]?


    request_options.headers.accept ?= @serializer.get_serializer().get_content_type()

    if Object.keys(kwargs.args).length != 0
      request_options.url += '?' + querystring.stringify kwargs.args
    else
      if request_options.url.substr(-1) == '/'
        request_options.url = request_options.url.substr(0, request_options.url.length - 1)

    if kwargs.data?
      request_options.form = kwargs.data

    if @opts.auth
      request_options.auth =
        user: @opts.auth[0]
        pass: @opts.auth[1]
        sentImmediately: true

    if @opts.proxy
      request_options.proxy = opts.proxy

    unless hasInsensitive request_options.headers, 'user-agent'
      defaultVersion = require('../package.json').version
      request_options.headers['User-Agent'] = "node-slumber/#{defaultVersion}"

    return request_options


  _request: (method, kwargs, fn) =>
    request_options = @_construct_request method, kwargs

    debug "#{method}", request_options.url
    req = request request_options, fn

  callable: @::_create_child

  _prepare_opts: (from, default_dest='args') =>
    to =
      args: {}
      data: {}

    translation =
      query: 'args'

    for key, value of from
      if key[0...2] == '__'
        section = key[2...]
        if translation[section]?
          section = translation[section]
        for k, v of value
          to[section][k] = v
      else if key is 'headers'
        to.headers = value
      else
        to[default_dest][key] = value

    return to

  wrap_response: (fn, err, response, ret) =>
    switch fn.length
      when 1
        fn ret
      when 2
        fn err, ret
      when 3
        fn err, response, ret

  get: (query, fn) =>
    if 'function' is typeof query
      fn = query
      query = {}
    throw Error('Missing callback') unless fn?

    opts = @_prepare_opts query, 'args'

    handle = (err, response, body) =>
      return @wrap_response fn, err, null, null if err
      if 200 <= response.statusCode <= 299
        return @wrap_response fn, err, response, @_try_to_serialize(response, body)
      else if response?.statusCode
        return @wrap_response fn, { "statusCode": response.statusCode }, response, null
      else
        return @wrap_response fn, true, response, null

    resp = @_request 'GET', opts, handle

  delete: (query, fn) =>
    if 'function' is typeof query
      fn = query
      query = {}
    throw Error('Missing callback') unless fn?

    opts = @_prepare_opts query, 'args'

    handle = (err, response, body) =>
      if 200 <= response.statusCode <= 299
        if response.statusCode == 204
          return @wrap_response fn, err, response, true
        else # Keep it ?
          return @wrap_response fn, err, response, true
      else
        return @wrap_reponse fn, true, response, false

    resp = @_request 'DELETE', opts, handle

  post: (data, fn) =>
    throw Error('Missing callback') unless fn?

    opts = @_prepare_opts data, 'data'

    handle = (err, response, body) =>
      if 200 <= response.statusCode <= 299
        return @wrap_response fn, err, response, @_try_to_serialize(response, body)
      return @wrap_response fn, err, response, true

    resp = @_request 'POST', opts, handle

  put: (data, fn) =>
    throw Error('Missing callback') unless fn?

    opts = @_prepare_opts data, 'data'

    handle = (err, response, body) =>
      if 200 <= response.statusCode <= 299
        return @wrap_response fn, err, response, @_try_to_serialize(response, body)
      return @wrap_response fn, true, response, null

    resp = @_request 'PUT', opts, handle

  patch: (data, fn) =>
    throw Error('Missing callback') unless fn?

    opts = @_prepare_opts data, 'data'

    handle = (err, response, body) =>
      if 200 <= response.statusCode <= 299
        return @wrap_response fn, err, response, @_try_to_serialize(response, body)
      return @wrap_response fn, err, response, true

    resp = @_request 'PATCH', opts, handle


module.exports = API
