/**
 * node-airplay
 * 
 * @file HTTP Live Streaming
 * @author zfkun(zfkun@msn.com)
 */

var fs = require( 'fs' );
var os = require( 'os' );
var iconvlite = require('iconv-lite');
var jschardet = require("jschardet");
var url = require( 'url' );
var path = require( 'path' );
var http = require( 'http' );
var util = require( 'util' );
var events = require( 'events' );
var spawn = require( 'child_process' ).spawn;

var IP_LOCAL = require( './ip' );




function HLSServer( options ) {
    events.EventEmitter.call( this );
    var ops = this.options = options || {};

    // 是否启用流模式(影响m3u8生成机制)
    // ops.streaming = !!ops.streaming;
    // TS文件缓存
    ops.cache = !!ops.cache;
    // TS分片时长(s)
    ops.duration = ops.duration || 20;
    // 编解码库目录
    ops.lib = path.normalize( ops.lib || ( __dirname + '/../dep' ) ) + '/';
    if ( !fs.existsSync( ops.lib ) ) {
        ops.lib = '';   
    }
    // TS分片输出目录
    ops.out = path.normalize( ops.out || ( __dirname + '/../out' ) ) + '/';
    if ( !fs.existsSync( ops.out ) ) {
        fs.mkdirSync( ops.out );
    }
}

util.inherits( HLSServer, events.EventEmitter );
exports.HLS = HLSServer;


HLSServer.prototype.ffmpeg = function ( file_video,file_srt,file_format ,callback) {
    var self = this;
	
	var intput = file_video;
    var outfile = path.dirname(file_video)+"/video."+file_format;
	
	if (os.platform()=="win32"){
		outfile=path.dirname(file_video)+"\\video."+file_format;
	}

    var f = spawn(
        this.options.lib + 'ffmpeg',
        this.custom4FFMpeg( file_video,outfile,file_srt,file_format)
    );
	
	

    var output = '';
    f.stdout.on( 'data', function ( chunk ) {
        output += chunk;
        self.emit( 'process', { index: index, file: outfile, out: chunk } );
    });	
	
    f.stdout.on( 'end', callback);
};

HLSServer.prototype.custom4FFMpeg = function (inputfile,outfile,file_srt,file_format ) {
	//'ISO-8859-7'
	
    var opt_1 = [
		'-fflags',
		'+genpts',
        '-y',
        '-i',
        inputfile
    ];
	
	if (file_srt!=null && file_srt!=""){
		opt_1.push("-sub_charenc");
		opt_1.push(jschardet.detect(fs.readFileSync(file_srt)).encoding);
		opt_1.push("-i");
		opt_1.push(file_srt);
		opt_1.push("-c:s");
		
		if (file_format=="mp4")
			opt_1.push("mov_text");
		else if (file_format=="mkv")
			opt_1.push("copy");	
		
		opt_1.push("-preset");
		opt_1.push("veryfast");
	}
	
	opt_1.push("-c:v");
	opt_1.push("copy");
	opt_1.push("-c:a");
	opt_1.push("copy");
	
	if (file_format=="mp4")
	{
		opt_1.push("-f");
		opt_1.push("mp4");
	}
	
    //opt_1.push(outfile.substr(0, outfile.lastIndexOf('.'))+".mp4");
	opt_1.push(outfile);
	
	console.log(opt_1[0]+" "+opt_1[1]+" "+opt_1[2]+" "+opt_1[3]+" "+opt_1[4]+" "+opt_1[5]+" "+opt_1[6]+" "+opt_1[7]+" "+opt_1[8]+" "+opt_1[9]+" "+opt_1[10]+" "+opt_1[11]+" "+opt_1[12]+" "+opt_1[13]+" "+opt_1[14]+" "+opt_1[15]+" "+opt_1[16]+" "+opt_1[17]);
	
    return opt_1;
};


HLSServer.prototype.start = function ( port ) {
    if ( !this.started ) {
        this.started = !0;

        this.baseURI = 'http://' + IP_LOCAL + ( port === 80 ? '' : ':' + port );

        this.server = http.createServer( this.httpHandler.bind( this ) );
        this.server.listen( port, IP_LOCAL );

        this.emit( 'start', { host: IP_LOCAL, port: port } );
    }

    return this;
};

HLSServer.prototype.stop = function() {
    if ( this.started && this.server ) {
        this.server.close();
        this.emit( 'stop' );
    }

    this.started = !1;

    return this;
};

HLSServer.prototype.getURI = function ( type, index ) {
    if ( type === 'video' ) {
        return '/stream/0.m3u8';
    }
    else if ( type === 'audio' ) {
        return '/straem/1.m3u8';
    }
    else if ( type === 'iframes' ) {
        return '/iframes.m3u8';
    }
    else if ( type === 'segment' ) {
        return '/stream/0/' + index + '.ts';
    }
    else {
        return this.baseURI;
    }
};

HLSServer.prototype.open = function ( fileFullPath, callback ) {
    var self = this;

    if ( this.openThread ) {
        this.openThread.kill();
    }

    this.file = fileFullPath;

    this.openThread = spawn(
        this.options.lib + 'ffprobe',
        this.command4FFProbe( this.file )
    );

    var output = '';
    this.openThread.stdout.on( 'data', function ( chunk ) {
        output += chunk;
    });
    this.openThread.stderr.on( 'data', function ( err ) {
        self.emit(
            'error',
            { type: 'open', err: err, file: fileFullPath }
        );
    });
    this.openThread.stdout.on( 'end', function () {
        var json;
        try {
            json = JSON.parse( output );
        } catch (e) {
            self.emit(
                'error',
                { type: 'open', err: e.message, file: fileFullPath }
            );
        }

        if ( json ) {
            self.videoInfo = json;

            // update store
            self.segmentSize = Math.ceil( parseFloat( json.format.duration, 10 ) / self.options.duration );

            self.emit( 'open', { file: fileFullPath, info: json } );
        }

        if ( callback ) {
            callback( json );
        }

        self.openThread = null;
    });

    return this;
};


HLSServer.prototype.segment = function ( index, req, res ) {
    var self = this;
    var outfile = this.options.out + index + '.ts';

    // skip if exists
    if ( fs.existsSync( outfile ) ) {
        fs.createReadStream( outfile ).pipe( res );
        return;
    }

    var f = spawn(
        this.options.lib + 'ffmpeg',
        this.command4FFMpeg( index, outfile )
    );

    var output = '';
    f.stdout.on( 'data', function ( chunk ) {
        output += chunk;
        self.emit( 'process', { index: index, file: outfile, out: chunk } );
    });
    f.stdout.on( 'error', function ( err ) {
        self.emit(
            'error',
            { type: 'segment', err: err, index: index, file: outfile }
        );
    });

    f.stdout.on( 'end', function () {
        self.emit( 'segment', { index: index, file: outfile, out: output } );
        fs.createReadStream( outfile ).pipe( res );
    });

};

HLSServer.prototype.command4FFProbe = function ( filePath ) {
    var opt = [
        '-v',
        'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        filePath
    ];

    return opt;
};

HLSServer.prototype.command4FFMpeg = function ( tsIndex, tsOutput ) {
    var opt = [
        '-y',
        '-i',
        this.file,
        '-t', this.options.duration,
        '-ss', this.options.duration * (tsIndex - 1),
    ];

    var isH264 = this.videoInfo.streams.some(function ( s ) {
        return s.codec_name === 'h264';
    });

    // h264 && aac
    if ( isH264 ) {
        opt = opt.concat([
            '-c:v', 'libx264', // libx264 || copy
            '-c:a', 'aac', // aac || copy
            '-strict', '-2',
            '-vbsf', 'h264_mp4toannexb'
        ]);
    }
    else {
        opt = opt.concat([
            '-c:v', 'linx264',
            '-c:a', 'aac',
            // '-g', 100,
            // '-vcodec', 'copy',
            // '-acodec', 'copy',
            '-b', '500k',
            '-ac', '2',
            '-ar', '44100',
            '-ab', '32k'
        ]);
    }

    // TODO: HLS by ffmpeg
    // opt = opt.concat([
    //     '-f', 'hls',
    //     '-hls_time', '10',
    //     '-hls_list_size', '999',
    //     'out/0.m3u8'
    // ]);

    opt.push( tsOutput );

    return opt;
};

HLSServer.prototype.httpHandler = function ( request, response ) {
    var ops = this.options;
    var header = {};
    var body = [];
    var uri = url.parse( request.url, true );

    this.emit( 'request', request );

    if ( uri.pathname === '/' ) {
        body.push( '#EXTM3U' );
        body.push( '#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",LANGUAGE="und",NAME="Original Audio",DEFAULT=YES,AUTOSELECT=YES' );

        // stream#0
        body.push( '#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=20000000,CODECS="mp4a.40.2,avc1.640028",AUDIO="audio"' );
        body.push( this.getURI( 'video' ) );

        // // stream#1
        // body.push( '#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=20000000,CODECS="ac-3,avc1.640028",AUDIO="audio"' );
        // body.push( '/stream/1.m3u8' );

        // // frames
        // body.push( '#EXT-X-I-FRAME-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=20000000,CODECS="avc1.640028",URI="/iframes.m3u8"' );
        
        body.push( '#EXT-X-ENDLIST' );
        body = body.join( '\n' );

        // header['Content-Type'] = 'application/vnd.apple.mpegurl';
        header[ 'Content-Length' ] = body.length;

        response.writeHead( 200, header );
        response.write( body );

        response.end();
    }
    else if ( uri.pathname === this.getURI( 'video' ) ) {
        var tsDuration = ops.duration;
        var videoDuration = parseFloat( this.videoInfo.format.duration, 10 );

        body.push( '#EXTM3U' );
        body.push( '#EXT-X-VERSION:3' );
        // body.push( '#EXT-X-PLAYLIST-TYPE:EVENT' );
        body.push( '#EXT-X-MEDIA-SEQUENCE:0' );
        body.push( '#EXT-X-TARGETDURATION:' + tsDuration );
        body.push( '#EXT-X-PLAYLIST-TYPE:VOD' );
        body.push( '#EXT-X-ALLOW-CACHE:' + ( ops.cache ? 'YES' : 'NO') );

        for ( var i = 1, n = this.segmentSize; i < n; i++ ) {
            body.push(
                '#EXTINF:'
                // 最后一个分段一般会少一点，需要精确计算下
                + ( i >= n ? ( videoDuration % tsDuration || tsDuration ) : tsDuration )
                + ','
            );
            body.push( this.getURI( 'segment', i ) );
        }

        body.push( '#EXT-X-ENDLIST' );
        body = body.join( '\n' );

        // header['Connection'] = 'Keep-Alive';
        // header['Content-Type'] = 'application/vnd.apple.mpegurl';
        header['Content-Length'] = body.length;

        response.writeHead( 200, header );
        response.write( body );
        response.end();
    }
    // else if ( uri.pathname === this.getURI( 'audio' ) ) {
    // }
    // else if ( uri.pathname === this.getURI( 'iframes' ) ) {
    //     body.push( '#EXTM3U' );
    //     body.push( '#EXT-X-VERSION:4' );
    //     body.push( '#EXT-X-TARGETDURATION:3' );
    //     body.push( '#EXT-X-I-FRAMES-ONLY' );
    //     body.push( '#EXT-X-PLAYLIST-TYPE:VOD' );
    //     body.push( '#EXT-X-ALLOW-CACHE:YES' );
    //     body.push( '#EXT-X-MEDIA-SEQUENCE:0' );

    //     body.push( '#EXTINF:3.000000000000000,' );
    //     body.push( '#EXT-X-BYTERANGE:2097152@564' );
        
    //     body.push( '/iframes/0.ts' );
    //     body.push( '#EXTINF:3.000000000000000,' );
    //     body.push( '#EXT-X-BYTERANGE:2097152@564' );
    //     body.push( '/iframes/1.ts' );
    //     ...

    //     body.push( '#EXT-X-ENDLIST' );
    // }
    else if ( /^\/stream\/0\//.test( uri.pathname ) ) {
        header['Content-Type'] = 'video/MP2T';
        response.writeHead( 200, header );

        var tsIndex = parseInt( path.basename( uri.pathname, '.ts' ), 10 );
        this.segment( tsIndex, request, response );

        this.emit( 'stream', tsIndex, this.segmentSize );

        // fs.createReadStream( filePath ).pipe( response );
        // response.write( fs.readFileSync( filePath ) );
        // response.end();
    } else {
        response.writeHead( 404 );
        response.end();
    }

};

