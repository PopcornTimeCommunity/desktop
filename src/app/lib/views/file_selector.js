(function (App) {
    'use strict';

    var _this,
        formatMagnet;

    var FileSelector = Backbone.Marionette.ItemView.extend({
        template: '#file-selector-tpl',
        className: 'file-selector',

        events: {
            'click .close-icon': 'closeSelector',
            'click .file-item': 'startStreaming',
            'click .store-torrent': 'storeTorrent',
            'click .playerchoicemenu li a': 'selectPlayer'
        },

        initialize: function () {
            _this = this;

            formatMagnet = function (link) {
                // format magnet with Display Name
                var index = link.indexOf('\&dn=') + 4, // keep display name
                    _link = link.substring(index); // remove everything before dn
                _link = _link.split('\&'); // array of strings starting with &
                _link = _link[0]; // keep only the first (i.e: display name)
                _link = _link.replace(/\+/g, '.'); // replace + by .
                _link = _link.replace(/%5B/g, '[').replace(/%5D/g, ']');
                _link = _link.replace(/%28/g, '(').replace(/%29/g, ')');
                link = _link.replace(/\W$/, ''); // remove trailing non-word char
                return link;
            };
        },

        onBeforeRender: function () {
            if(AdvSettings.get('activateFakeSkan')===true) {
				this.bitsnoopRequest(this.model.get('torrent').infoHash);
			}
        },

        onShow: function () {
            this.isTorrentStored();
			
            Mousetrap.bind(['esc', 'backspace'], function (e) {
                _this.closeSelector(e);
            });

            App.Device.Collection.setDevice(Settings.chosenPlayer);
            App.Device.ChooserView('#player-chooser2').render();
            this.$('#watch-now').text('');
			
			// get all a in file-selector and click the one with highest size
			var li = document.getElementsByTagName("li");
			var length = li.length;
			// variable for the highest one
			var highest = 0;
			// loop over to find the highest ID by looking at the property parsed as an int
			for(var i = 0; i < length; i++) {
				var id= parseInt(li[i].id.substring(1, li[i].id.length), 10);
				if(id > highest) {
					highest = id;
				}
			}
			
			if (AdvSettings.get('autoStoreTorrents')===true && !this.isTorrentStored()){
				this.storeTorrent();
			}

			//XXX: Workaround by nasabeyonds
			if (AdvSettings.get('chosenPlayer')=='html5'){
				AdvSettings.set('chosenPlayer', 'local');
			}

			if(AdvSettings.get('activateAutoplay')===true){
				$('#s'+highest).click();
			}
        },

        bitsnoopRequest: function (hash) {
            var endpoint = 'http://bitsnoop.com/api/fakeskan.php?hash=';

            request({
                method: 'GET',
                url: endpoint + hash,
                headers: {
                    'User-Agent': 'request'
                }
            }, function (error, response, body) {
                if (!error && response.statusCode <= 400) {
                    if (body === 'FAKE') {
                        $('.fakeskan').text(i18n.__('%s reported this torrent as fake', 'FakeSkan')).show();
                    }
                }
            });
        },

        startStreaming: function (e) {
            var torrent = _this.model.get('torrent');
            var file = parseInt($(e.currentTarget).attr('data-file'));
            var actualIndex = parseInt($(e.currentTarget).attr('data-index'));
            torrent.name = torrent.files[file].name;

            var torrentStart = new Backbone.Model({
                torrent: torrent,
                torrent_read: true,
                file_index: actualIndex,
                device: App.Device.Collection.selected
            });
            try { App.MovieDetailView.closeDetails(); } catch(e) {}
            App.vent.trigger('stream:start', torrentStart);
            App.vent.trigger('system:closeFileSelector');
        },

        isTorrentStored: function () {
            var target = require('nw.gui').App.dataPath + '/TorrentCollection/';

            // bypass errors
            if (!Settings.droppedTorrent && !Settings.droppedMagnet) {
                $('.store-torrent').hide();
                return false;
            } else if (Settings.droppedMagnet && Settings.droppedMagnet.indexOf('\&dn=') === -1) {
                $('.store-torrent').text(i18n.__('Cannot be stored'));
                $('.store-torrent').addClass('disabled').prop('disabled', true);
                //alert('Magnet lacks Display Name, unable to store it');
                win.warn('Magnet lacks Display Name, unable to store it');
                return false;
            }
            var file, _file;
            if (Settings.droppedTorrent) {
                file = Settings.droppedTorrent;
				//alert("droppedTorrent: "+file);
            } else if (!Settings.droppedStoredMagnet) {
				//else if (Settings.droppedMagnet && !Settings.droppedStoredMagnet) {
                _file = Settings.droppedMagnet,
                    file = formatMagnet(_file) + '.torrent';
					//alert("droppedMagnet, droppedStoredMagnet=false: "+file);
            } else if (Settings.droppedStoredMagnet) {
				//else if (Settings.droppedMagnet && Settings.droppedStoredMagnet) {
                file = Settings.droppedStoredMagnet;
				//alert("droppedMagnet, droppedStoredMagnet=true: "+file);
            }

            // check if torrent stored
            if (!fs.existsSync(target + file)) {
                $('.store-torrent').text(i18n.__('Store this torrent'));
                return false;
            } else {
                $('.store-torrent').text(i18n.__('Remove this torrent'));
                return true;
            }
        },

        storeTorrent: function () {
            var torrent_display_name, torrent_file_name, cached_torrent_hashname;

            var source = require('os').tmpDir() + '/Popcorn-Time/TorrentCache/',
                target = require('nw.gui').App.dataPath + '/TorrentCollection/';

            if (Settings.droppedTorrent) {
                torrent_file_name = Settings.droppedTorrent;
                cached_torrent_hashname = Common.md5(path.basename(torrent_file_name));

                if (this.isTorrentStored()) {
                    fs.unlinkSync(target + torrent_file_name); // remove the torrent
                    win.debug('Torrent Collection: deleted', torrent_file_name);
                    //alert('Torrent Collection: deleted', torrent_file_name);
                } else {
                    if (!fs.existsSync(target)) {
                        fs.mkdir(target); // create directory if needed
                    }
                    fs.writeFileSync(target + torrent_file_name, fs.readFileSync(source + cached_torrent_hashname + '.torrent')); // save torrent
                    win.debug('Torrent Collection: added', torrent_file_name);
                    //alert('Torrent Collection: added', torrent_file_name);
                }
            } else if (Settings.droppedMagnet) {
                torrent_display_name = formatMagnet(Settings.droppedMagnet);
                torrent_file_name = Settings.droppedStoredMagnet ? Settings.droppedStoredMagnet : torrent_display_name;
                cached_torrent_hashname = Common.md5(path.basename(Settings.droppedMagnet));

                if (this.isTorrentStored()) { // this is only for compatability, since we don't have magnet links stored anymore
                    fs.unlinkSync(target + torrent_file_name); // remove the magnet
                    win.debug('Torrent Collection: deleted', torrent_file_name);
                    //alert('Torrent Collection: deleted', torrent_file_name);
                } else {
                    if (!fs.existsSync(target)) {
                        fs.mkdir(target); // create directory if needed
                    }

                    fs.writeFileSync(target + torrent_file_name + '.torrent', fs.readFileSync(source + cached_torrent_hashname + '.torrent')); // save torrent
                    win.debug('Torrent Collection: added', torrent_file_name);
                    //alert('Torrent Collection: added', torrent_file_name);
                }
            }
            this.isTorrentStored(); // trigger button change

            if (App.currentview === 'Torrent-collection') {
                App.vent.trigger('torrentCollection:show'); // refresh collection
            }
        },

        selectPlayer: function (e) {
            var player = $(e.currentTarget).parent('li').attr('id').replace('player-', '');
            _this.model.set('device', player);
            if (!player.match(/[0-9]+.[0-9]+.[0-9]+.[0-9]/ig)) {
                AdvSettings.set('chosenPlayer', player);
            }
        },

        closeSelector: function (e) {
            Mousetrap.bind('backspace', function (e) {
                App.vent.trigger('show:closeDetail');
                App.vent.trigger('movie:closeDetail');
            });
            $('.filter-bar').show();
            $('#header').removeClass('header-shadow');
            $('#movie-detail').show();
            App.vent.trigger('system:closeFileSelector');
        },

        onDestroy: function () {
            Settings.droppedTorrent = false;
            Settings.droppedMagnet = false;
            Settings.droppedStoredMagnet = false;

            //Clean TorrentCache
            App.Providers.TorrentCache().clearTmpDir();
            App.Providers.TorrentCache()._checkTmpDir();
        },

    });

    App.View.FileSelector = FileSelector;
})(window.App);
