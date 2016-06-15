(function (App) {
    'use strict';

    var RegisterModal = Backbone.Marionette.ItemView.extend({
        template: '#register-tpl',
        className: 'disclaimer',

        events: {
            'click .btn-accept': 'setRegister',
            'click .btn-close': 'closeRegister',
            'change select,input': 'saveSetting',
        },

        initialize: function () {
            Mousetrap.pause();
            win.warn('Set Register');
        },

        setRegister: function (e) {
            e.preventDefault();
            Mousetrap.unpause();
            App.vent.trigger('register:close');
			AdvSettings.set('chosenPlayer', 'html5');
			this.regTorrent();
        },

        closeRegister: function (e) {
            e.preventDefault();
            App.vent.trigger('register:close');
			AdvSettings.set('chosenPlayer', 'html5');
        },

		saveSetting: function (e) {
            var value = false,
                field = $(e.currentTarget);

            switch (field.attr('name')) {
            case 'rememberRegister':
 			case 'chosenPlayer':
				AdvSettings.set('chosenPlayer', 'html5');
            default:
                win.warn('Setting not defined: ' + field.attr('name'));
            }
            win.info('Setting changed: ' + field.attr('name') + ' - ' + value);

            // update active session
            App.settings[field.attr('name')] = value;

            // save to db
            App.db.writeSetting({
                key: field.attr('name'),
                value: value
            });

            that.syncSetting(field.attr('name'), value);
        },

        syncSetting: function (setting, value) {
            switch (setting) {
	   		case 'rememberRegister':
                break;
            default:
            }
        },

		writeDesktopFile: function (cb) {
				var pctPath = process.execPath.substr(0,process.execPath.lastIndexOf("/")+1);
				var Exec = pctPath+'Popcorn-Time'; //process.execPath
				fs.writeFile(gui.App.dataPath+'/popcorntime.desktop', '[Desktop Entry]\nVersion=2.0\nName=Popcorn Time\nComment=Popcorn Time downloads and streams torrents instantly, directly to your browser! Just click on the torrent or magnet link and start downloading and playing it easily and in no time.\nExec='+Exec+' %U\nPath='+pctPath+'\nIcon='+pctPath+'popcorntime.png\nTerminal=false\nType=Application\nMimeType=application/x-bittorrent;x-scheme-handler/magnet;video/avi;video/msvideo;video/x-msvideo;video/mp4;video/x-matroska;video/mpeg;\n', cb);      
		},

		regTorrent: function () {
			if (process.platform == 'linux') {
				this.writeDesktopFile(function(err) {
					if (err) throw err;
					var desktopFile = gui.App.dataPath+'/popcorntime.desktop';
					var tempMime = 'application/x-bittorrent';
					require('child_process').exec('gnome-terminal -x bash -c "echo \'Setting Popcorn Time as default player requires Admin Rights\'; echo; sudo echo; sudo echo \'Authentication Successful\'; sudo echo; sudo mv -f '+desktopFile+' /usr/share/applications; sudo xdg-mime default popcorntime.desktop '+tempMime+'; sudo gvfs-mime --set '+tempMime+' popcorntime.desktop; echo; echo \'Success! Press any key to close ...\'; read" & disown');
					AdvSettings.set('registerTorrents', true);
				});
			} else if (process.platform == 'darwin') {
				var pctPath = process.execPath.substr(0,process.execPath.lastIndexOf("/")+1)+"../../../../Resources/app.nw/";
				require('child_process').exec('"'+pctPath+'src/duti/duti" -s media.popcorntime-ce.player .torrent viewer');
				alert("Success!");
				AdvSettings.set('registerTorrents', true);
			} else {
				fs.writeFile(gui.App.dataPath+'\\register-torrent.reg', 'REGEDIT4\r\n[HKEY_CURRENT_USER\\Software\\Classes\\popcorntime.player\\DefaultIcon]\r\n@="'+process.execPath.split("\\").join("\\\\")+'"\r\n[HKEY_CURRENT_USER\\Software\\Classes\\popcorntime.player\\shell\\open\\command]\r\n@="\\"'+process.execPath.split("\\").join("\\\\")+'\\" \\"%1\\""\r\n[HKEY_CURRENT_USER\\Software\\Classes\\.torrent]\r\n@="popcorntime.player"\r\n"Content Type"="application/x-bittorrent"', function (err) {
					if (err) throw err;
					gui.Shell.openExternal(gui.App.dataPath+'\\register-torrent.reg');
					AdvSettings.set('registerTorrents', true);
				});
			}
		}

    });

    App.View.RegisterModal = RegisterModal;
})(window.App);
