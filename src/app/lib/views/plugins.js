(function (App) {
    'use strict';
    var that;

    var Plugins = Backbone.Marionette.ItemView.extend({
        template: '#plugins-tpl',
        className: 'settings-container-contain',

        ui: {
            success_alert: '.success_alert'
        },

		events: {
            'click .close-icon': 'closePlugins',
            'change select,input': 'saveSetting',
			'click #authTrakt': 'connectTrakt',
            'click #unauthTrakt': 'disconnectTrakt',
            'click #connect-with-tvst': 'connectWithTvst',
            'click #disconnect-tvst': 'disconnectTvst',
            'click #syncTrakt': 'syncTrakt'
        },

 		onShow: function () {
            that = this;

            $('.filter-bar').hide();
            $('#movie-detail').hide();
            $('#header').addClass('header-shadow');
            $('.tooltipped').tooltip({
                delay: {
                    'show': 800,
                    'hide': 100
                }
            });

            Mousetrap.bind('backspace', function (e) {
                App.vent.trigger('plugins:close');
            });
        },

        onDestroy: function () {
            Mousetrap.unbind(['esc', 'backspace']);
            $('.filter-bar').show();
            $('#header').removeClass('header-shadow');
            $('#movie-detail').show();
        },

        closePlugins: function () {
            App.vent.trigger('plugins:close');
        },

        saveSetting: function (e) {
            var value = false,
                apiDataChanged = false,
                tmpLocationChanged = false,
                field = $(e.currentTarget),
                data = {};

            switch (field.attr('name')) {
            case 'activateWatchlist':
            case 'pluginRARBGsearch':
				value = field.is(':checked');
				if(value)
		            AdvSettings.set('onlineSearchEngine', 'RARBG');
				else
		            AdvSettings.set('onlineSearchEngine', 'KAT');
                break;
            case 'pluginKATsearch':
				value = field.is(':checked');
				if(value)
		            AdvSettings.set('onlineSearchEngine', 'KAT');
				else
		            AdvSettings.set('onlineSearchEngine', 'RARBG');
                break;
            case 'pluginGoogleDrive':
			case 'pluginVLC':
            case 'pluginFakeSkan':
            case 'pluginHTML5':
				value = field.is(':checked');
				if(value)
					AdvSettings.set('chosenPlayer', 'html5');
				else
					AdvSettings.set('chosenPlayer', 'local');
                break;
            default:
                win.warn('Setting not defined: ' + field.attr('name'));
            }
            win.info('Setting changed: ' + field.attr('name') + ' - ' + value);


            // update active session
            App.settings[field.attr('name')] = value;

            if (apiDataChanged) {
                App.vent.trigger('initHttpApi');
            }

            // move tmp folder safely
            if (tmpLocationChanged) {
                that.moveTmpLocation(value);
            }

            // save to db
            App.db.writeSetting({
                key: field.attr('name'),
                value: value
            }).then(function () {
                that.ui.success_alert.show().delay(3000).fadeOut(400);
            });

            that.syncSetting(field.attr('name'), value);
        },

        syncSetting: function (setting, value) {
            switch (setting) {
	   		case 'pluginRARBGsearch':
                App.vent.trigger('plugins:show');
				that.alertMessageSuccess(true);
                break;	   		
			case 'pluginKATsearch':
                App.vent.trigger('plugins:show');
				that.alertMessageSuccess(true);
                break;			
			case 'activateWatchlist':
                App.vent.trigger('plugins:show');
				that.alertMessageSuccess(true);
                break;
            default:
            }
        },

        connectTrakt: function (e) {
            if (AdvSettings.get('traktTokenRefresh') !== '') {
                return;
            }

            $('#authTrakt > i').css('visibility', 'hidden');
            $('.loading-spinner').show();

            App.Trakt.oauth.authenticate()
                .then(function (valid) {
                    if (valid) {
                        $('.loading-spinner').hide();
                        that.render();
                    } else {
                        $('.loading-spinner').hide();
                        $('#authTrakt > i').css('visibility', 'visible');
                    }
                }).catch(function (err) {
                    win.debug('Trakt', err);
                    $('#authTrakt > i').css('visibility', 'visible');
                    $('.loading-spinner').hide();
                });
        },

        disconnectTrakt: function (e) {
            App.settings['traktToken'] = '';
            App.settings['traktTokenRefresh'] = '';
            App.settings['traktTokenTTL'] = '';
            App.Trakt.authenticated = false;

            App.db.writeSetting({
                key: 'traktToken',
                value: ''
            }).then(function () {
                return App.db.writeSetting({
                    key: 'traktTokenRefresh',
                    value: ''
                });
            }).then(function () {
                return App.db.writeSetting({
                    key: 'traktTokenTTL',
                    value: ''
                });
            }).then(function () {
                that.ui.success_alert.show().delay(3000).fadeOut(400);
            });

            _.defer(function () {
                App.Trakt = App.Providers.get('Trakttv');
                that.render();
            });
        },

        connectWithTvst: function () {
            var self = this;

            $('#connect-with-tvst > i').css('visibility', 'hidden');
            $('.tvst-loading-spinner').show();

            App.vent.on('system:tvstAuthenticated', function () {
                window.loginWindow.close();
                $('.tvst-loading-spinner').hide();
                self.render();
            });
            App.TVShowTime.authenticate(function (activateUri) {
                var gui = require('nw.gui');
                gui.App.addOriginAccessWhitelistEntry(activateUri, 'app', 'host', true);
                window.loginWindow = gui.Window.open(activateUri, {
                    position: 'center',
                    focus: true,
                    title: 'TVShow Time',
                    icon: 'src/app/images/icon.png',
                    toolbar: false,
                    resizable: false,
                    width: 600,
                    height: 600
                });

                window.loginWindow.on('closed', function () {
                    $('.tvst-loading-spinner').hide();
                    $('#connect-with-tvst > i').css('visibility', 'visible');
                });

            });
        },

        disconnectTvst: function () {
            var self = this;
            App.TVShowTime.disconnect(function () {
                self.render();
            });
        },

        syncTrakt: function () {
            var oldHTML = document.getElementById('syncTrakt').innerHTML;
            $('#syncTrakt')
                .text(i18n.__('Syncing...'))
                .addClass('disabled')
                .prop('disabled', true);

            Database.deleteWatched(); // Reset before sync

            App.Trakt.syncTrakt.all()
                .then(function () {
                    App.Providers.get('Watchlist').fetchWatchlist();
                })
                .then(function () {
                    $('#syncTrakt')
                        .text(i18n.__('Done'))
                        .removeClass('disabled')
                        .addClass('ok')
                        .delay(3000)
                        .queue(function () {
                            $('#syncTrakt')
                                .removeClass('ok')
                                .prop('disabled', false);
                            document.getElementById('syncTrakt').innerHTML = oldHTML;
                            $('#syncTrakt').dequeue();
                        });
                })
                .catch(function (err) {
                    win.error('App.Trakt.syncTrakt.all()', err);
                    $('#syncTrakt')
                        .text(i18n.__('Error'))
                        .removeClass('disabled')
                        .addClass('warning')
                        .delay(3000)
                        .queue(function () {
                            $('#syncTrakt')
                                .removeClass('warning')
                                .prop('disabled', false);
                            document.getElementById('syncTrakt').innerHTML = oldHTML;
                            $('#syncTrakt').dequeue();
                        });
                });
        },

        alertMessageSuccess: function (btnRestart, btn, btnText, successDesc) {
            var notificationModel = new App.Model.Notification({
                title: i18n.__('Success'),
                body: successDesc,
                type: 'success'
            });

            if (btnRestart) {
                notificationModel.set('showRestart', true);
                notificationModel.set('body', i18n.__('Please restart your application'));
            } else {
                // Hide notification after 3 seconds
                setTimeout(function () {
                    btn.text(btnText).removeClass('confirm warning disabled').prop('disabled', false);
                    App.vent.trigger('notification:close');
                }, 3000);
            }

            // Open the notification
            App.vent.trigger('notification:show', notificationModel);
        },




	});

    App.View.Plugins = Plugins;
})(window.App);
