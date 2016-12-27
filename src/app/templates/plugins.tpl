<div class="settings-container">
    <div class="fa fa-times close-icon"></div>
    <div class="success_alert" style="display:none"><%= i18n.__("Saved") %>&nbsp;<span id="checkmark-notify"><div id="stem-notify"></div><div id="kick-notify"></div></span></div>

    <section id="title">
        <div class="title"><%= i18n.__("Plugins") %></div>
    </section>


	<section>
        <div class="content">
			<span style="height:25px;">
                <input class="settings-checkbox" name="pluginKATsearch" id="pluginKATsearch" type="checkbox" <%=(Settings.pluginKATsearch? "checked='checked'":"")%>>
                <label class="settings-label" for="pluginKATsearch">KAT Search</label>
            </span>
            <div style="margin-left:25px;">
                <span style="overflow:hidden; height:auto; padding-bottom:10px; line-height:normal;">
					KickassTorrents (sometimes abbreviated KAT) uses the bittorrent protocol and provides torrent files and magnet links - it is a torrent search engine launched in 2008 which provides a user friendly API that will make the search of torrents easier and organised. It is not a tracker and hosts no content. 
					<table style="margin-top:10px;">
						<tr><td style="color: #888;" width="100px">Description:</td> <td>Search and stream any movies or series on KAT (Kickass Torrent).</td></tr>						
						<tr><td style="color: #888;" width="100px">Supported:</td> <td>Opensubtitles, Chromecast, Airplay, DLNA, Virus Scanner, Torrent History</td></tr>
						<tr><td style="color: #888;">Website:</td> <td>https://kat.cr</td></tr>
					</table>
                </span>
            </div>
        </div>
    </section>

	<section>
        <div class="content">
			<span style="height:25px;">
                <input class="settings-checkbox" name="pluginRARBGsearch" id="pluginRARBGsearch" type="checkbox" <%=(Settings.pluginRARBGsearch? "checked='checked'":"")%>>
                <label class="settings-label" for="pluginRARBGsearch">Rarbg Search</label>
            </span>
            <div style="margin-left:25px;">
                <span style="overflow:hidden; height:auto; padding-bottom:10px; line-height:normal;">
					Rarbg (sometimes abbreviated RBG) is a website, founded in 2008, that provides torrent files and magnet links to facilitate peer-to-peer file sharing using the BitTorrent protocol.
					<table style="margin-top:10px;">
						<tr><td style="color: #888;" width="100px">Description:</td> <td>API to search movies on rarbg. </td></tr>
						<tr><td style="color: #888;" width="100px">Supported:</td> <td>Opensubtitles, Chromecast, Airplay, DLNA, Virus Scanner, Torrent History</td></tr>
						<tr><td style="color: #888;">Website:</td> <td>https://rarbg.to</td></tr>
					</table>
                </span>
            </div>
        </div>
    </section>

	<section>
        <div class="content">
			<span style="height:25px;">
                <input class="settings-checkbox" name="pluginGoogleDrive" id="pluginGoogleDrive" type="checkbox" <%=(Settings.pluginGoogleDrive == true? "checked='checked'":"")%>>
                <label class="settings-label" for="pluginGoogleDrive">Google Drive Player</label>
            </span>
            <div style="margin-left:25px;">
                <span style="overflow:hidden; height:auto; padding-bottom:10px; line-height:normal;">
                    The Google Drive plugin provides the highest level of security and safety. Unlike a traditional torrent, Google Drive does not log or share your IP address with other users. The list of mirrors are encrypted, and the files are downloaded through googlevideo.com directly, which has a built-in antivirus scanner. Only the direct file (MP4, MKV, AVI, etc) file can be shared through Google Cloud Player, so no viruses can possibly be downloaded through Google Cloud. Torrents are prone to spreading viruses, bloatware, malware, and fake files. However, the quality might not be as good as with traditional torrents. If you prefer to use this player instead of the built-in one, you can do so by clicking the allocated icon on the 'Watch' button. All list of your installed players will be shown, select Google Drive and Popcorn Time will send everything to it.
					<table style="margin-top:10px;">
						<tr><td style="color: #888;" width="100px">Supported:</td> <td>Opensubtitles</td></tr>
						<tr><td style="color: #888;">Website:</td> <td>http://video2k.is</td></tr>
					</table>
                </span>
            </div>
        </div>
    </section>

	<section>
        <div class="content">
			<span style="height:25px;">
                <input class="settings-checkbox" name="pluginNachoLink" id="pluginNachoLink" type="checkbox" <%=(Settings.pluginNachoLink == true? "checked='checked'":"")%>>
                <label class="settings-label" for="pluginNachoLink"><%= i18n.__("HTML5 Video Player") %></label>
            </span>
            <div style="margin-left:25px;">
                <span style="overflow:hidden; height:auto; padding-bottom:10px; line-height:normal;">
                    This plugin downloads and streams torrents instantly, directly to any torrent website in your browser! Just click on the Nacho Link and start downloading and playing it easily and in no time. 
					<table style="margin-top:10px;">
						<tr><td style="color: #888; vertical-align:top;" width="100px">Requirements:</td> <td>To use it on any website, you have to enable a default protocol like torrent or magnet links (see playback settings).</td></tr>
						<tr><td style="color: #888;">Supported:</td> <td>Opensubtitles, Chromecast, Airplay, DLNA, Virus Scanner</td></tr>
						<tr><td style="color: #888;">Website:</td> <td>http://nachotime.to</td></tr>
					</table>
				</span>
            </div>
        </div>
    </section>

	<section>
        <div class="content">
			<span style="height:25px;">
                <input class="settings-checkbox" name="pluginVLC" id="pluginVLC" type="checkbox" <%=(Settings.pluginVLC == true? "checked='checked'":"")%>>
                <label class="settings-label" for="pluginVLC"><%= i18n.__("VLC Player") %></label>
            </span>
            <div style="margin-left:25px;">
                <span style="overflow:hidden; height:auto; padding-bottom:10px; line-height:normal;">
                    VLC media player (commonly known as VLC) is a portable, free and open-source, cross-platform media player and streaming media server written by the VideoLAN project. If you prefer to use this player instead of the built-in one, you can do so by clicking the allocated icon on the 'Watch' button. All list of your installed players will be shown, select VLC and Popcorn Time will send everything to it.
					<table style="margin-top:10px;">
						<tr><td style="color: #888;" width="100px">Supported:</td> <td>Opensubtitles</td></tr>
						<tr><td style="color: #888;">Website:</td> <td>http://www.videolan.org</td></tr>
					</table>
                </span>
            </div>
        </div>
    </section>

	<section>
        <div class="content">
			<span style="height:25px;">
                <input class="settings-checkbox" name="pluginFakeSkan" id="pluginFakeSkan" type="checkbox" <%=(Settings.pluginFakeSkan? "checked='checked'":"")%>>
                <label class="settings-label" for="pluginFakeSkan">Virus Scanner</label>
            </span>
            <div style="margin-left:25px;">
                <span style="overflow:hidden; height:auto; padding-bottom:10px; line-height:normal;">
					This plugin will warn you if an external torrent was flagged as 'fake'. Briefly, it's like a team of data analysts checking torrent to determine if it is verified. The only difference — we employ robots for this, which allows us to process insane amounts of torrents very fast.
					<table style="margin-top:10px;">
						<tr><td style="color: #888;" width="100px">Website:</td> <td>http://bitsnoop.com</td></tr>
					</table>
                </span>
            </div>
        </div>
    </section>

	<section id="trakt-tv">
        <div class="content"><!--<div class="title"><%= i18n.__("Trakt.tv") %></div>-->
			<span style="height:25px;">
                <input class="settings-checkbox" name="activateWatchlist" id="activateWatchlist" type="checkbox" <%=(Settings.activateWatchlist? "checked='checked'":"")%>>
                <label class="settings-label" for="activateWatchlist"><%= i18n.__("Watchlist") %></label>
            </span>
            <div style="margin-left:25px;" class="trakt-options<%= App.Trakt.authenticated ? " authenticated" : "" %>">
                <% if(App.Trakt.authenticated) { %>
                    <span>
                        <%= i18n.__("You are currently connected to %s", "Trakt.tv") %>.
                        <a id="unauthTrakt" class="unauthtext" href="#"><%= i18n.__("Disconnect account") %></a>
                    </span>
                    <span>
                        <input class="settings-checkbox" name="traktSyncOnStart" id="traktSyncOnStart" type="checkbox" <%=(Settings.traktSyncOnStart? "checked='checked'":"")%>>
                        <label class="settings-label" for="traktSyncOnStart"><%= i18n.__("Automatically Sync on Start") %></label>
                    </span>
                    <span>
                        <input class="settings-checkbox" name="traktPlayback" id="traktPlayback" type="checkbox" <%=(Settings.traktPlayback? "checked='checked'":"")%>>
                        <label class="settings-label" for="traktPlayback"><%= i18n.__("Resume Playback") %></label>
                    </span>
                    <span class="advanced">
                        <div class="btn-settings syncTrakt" id="syncTrakt">
                            <i class="fa fa-refresh">&nbsp;&nbsp;</i>
                            <%= i18n.__("Sync With Trakt") %>
                        </div>
                    </span>
                <% } else { %>
		            <span style="overflow:hidden; height:auto; padding-bottom:10px; line-height:normal;">
		                <%= i18n.__("Connect to %s to automatically 'scrobble' episodes you watch in %s", "Trakt.tv", "Popcorn Time") %>
						<table style="margin:10px 0;">
							<tr><td style="color: #888;" width="100px">Website:</td> <td>https://trakt.tv</td></tr>
						</table>
		            </span>
                    <span>
                        <div class="btn-settings syncTrakt" id="authTrakt">
                            <i class="fa fa-user-plus">&nbsp;&nbsp;</i>
                            <%= i18n.__("Connect To %s", "Trakt") %>
                        </div>
                        <div class="loading-spinner" style="display: none"></div>
                    </span>
                <% } %>
            </div>
        </div>
    </section>

	<section id="tvshowtime">
		<div class="content"><!--<div class="title">TVShow Time</div>-->
			<div style="margin-left:25px;" class="tvshowtime-options <%= App.TVShowTime.authenticated ? " authenticated" : "" %>">
				<% if(App.TVShowTime.authenticated) { %>
                    <span>
                        <%= i18n.__("You are currently connected to %s", "TVShow Time") %>.
                        <a id="disconnect-tvst" class="unauthtext" href="#"><%= i18n.__("Disconnect account") %></a>
                    </span>
				<% } else { %>
                    <span>
                        <div class="btn-settings" id="connect-with-tvst">
                            <i class="fa fa-user-plus">&nbsp;&nbsp;</i>
                            <%= i18n.__("Connect To %s", "TVShow Time") %>
                        </div>
                        <div class="tvst-loading-spinner" style="display: none"></div>
                    </span>
				<% } %>
			</div>
		</div>
	</section>

</div>
