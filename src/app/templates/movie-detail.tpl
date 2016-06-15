<%  
if(typeof backdrop === "undefined"){ backdrop = ""; }; 
if(typeof synopsis === "undefined"){ synopsis = "Synopsis not available."; }; 
if(typeof runtime === "undefined"){ runtime = "N/A"; };
for(var i = 0; i < genre.length; i++){ genre[i] = i18n.__(genre[i]); };
%>

<div data-bgr="<%= backdrop %>" class="backdrop"></div>
<div class="backdrop-overlay"></div>

<div class="fa fa-times close-icon"></div>

<section class="poster-box">
    <img src="images/posterholder.png" data-cover="<%= cover %>" class="mcover-image" />
</section>

<section class="content-box">

    <div class="meta-container">
        <div class="title"><%= title %></div>

        <div class="metadatas">
            <div class="metaitem"><%= year %></div><div class="dot"></div>

            <span id="runtime"><div class="metaitem"><%= runtime %> min</div><div class="dot"></div></span>

            <div class="metaitem"><%= genre.join(" / ") %></div><div class="dot"></div>

            <div data-toggle="tooltip" data-placement="top" title="<%=i18n.__("Open IMDb page") %>" class="movie-imdb-link"></div><div class="dot"></div>

            <div class="rating-container">
                <div class="star-container" data-toggle="tooltip" data-placement="right" title="<%= rating %>/10">
                <% var p_rating = Math.round(rating) / 2; %>
                   <% for (var i = 1; i <= Math.floor(p_rating); i++) { %>
                            <i class="fa fa-star rating-star"></i>
                        <% }; %>
                        <% if (p_rating % 1 > 0) { %>
                            <span class = "fa-stack rating-star-half-container">
                                <i class="fa fa-star fa-stack-1x rating-star-half-empty"></i>
                                <i class="fa fa-star-half fa-stack-1x rating-star-half"></i>
                            </span>
                        <% }; %>
                        <% for (var i = Math.ceil(p_rating); i < 5; i++) { %>
                            <i class="fa fa-star rating-star-empty"></i>
                    <% }; %>
                </div>
                <div class="number-container hidden"><%= rating %> <em>/10</em></div>
            </div>

	    <!--health, ratio-->
	    <div data-toggle="tooltip" data-placement="left" title="<%=i18n.__("Health false") %>" class="fa fa-circle health-icon <%= health %>"></div>
            <div data-toogle="tooltip" data-placement="left" title="<%=i18n.__("Magnet link") %>" class="fa fa-magnet magnet-link"></div>
            
        </div>

        <div class="overview" style="font-size:14px;">
		<%= synopsis %>

		<%  if (Settings.ytsAPI[0].url == 'http://yts.ph/') { %>
			<div style="margin-top:8px;"><div id="directors" style="color:#ccc; float:left; margin-right:5px;">Director:</div> <%= directors.join(" / ") %></div>

			<div style="margin-top:8px;"><div id="cast" style="color:#ccc; float:left; margin-right:5px;">Cast:</div> <%= cast.join(" / ") %></div>
		<% }; %>	

		<div style="margin-top:20px; color:#666; font-size:11px;">
		<div id="resources" style="float:left; margin-right:5px;">Provider: </div>
		<div id="yts" class="movie-yify-link provider" data-placement="top" data-id="<%= id %>" data-slug="<%= slug %>" data-poster="<%= cover %>" title="yts.ph">yts / </div>
		<div class="movie-video2k-link provider" data-placement="top" title="video2k.is">video2k / </div>
		<div class="movie-imdbid-link provider" data-placement="top" title="imdb.com">imdb / </div>
		<div class="movie-yifysubtitles-link provider" data-placement="top" title="yifysubtitles.com">yifysubtitles / </div>
		<div class="movie-googlevideo-link provider" data-placement="top" title="cloud src">googlecloud / </div>
		<div class="movie-youtube-link provider" data-placement="top" title="youtube.com">youtube</div>
		</div>
	</div>
    </div>

    <div class="bottom-container">

	<!--<div class="trailer" id="watch-trailer" data-placement="top" title="watch youtube trailer"><%=i18n.__("Watch Trailer") %></div>-->
	<div class="favourites-toggle"><%=i18n.__("Add to bookmarks") %></div>
        <div class="watched-toggle"><%=i18n.__("Not Seen") %></div>
	<br>


	<div class="button dropup" style="text-transform:uppercase;" id="player-chooser"></div>
	<!- data-placement="left" title="YIFY torrent - best quality at the smallest filesize" 
	Stream torrent - best quality at the smallest filesize but speed potentially throttled, ISP monitor & limited download bandwidth (by seeders)-->


        <!--<div id="watch-googlevideo" class="button" style="text-transform:uppercase;" data-placement="bottom" title="Google Cloud - very fast speed, no ISP monitor & unlimited download bandwidth">Stream</div>--><!-Play via Google Cloud - possibly bad quality but very fast speed, no ISP monitor & unlimited download bandwidth-->


	<div id="watch-trailer" class="button" data-placement="bottom"><%=i18n.__("Watch Trailer") %></div>
	<!- title="Watch youtube trailer" -->

	<div class="movie-quality-container">
           <% if (torrents["720p"] !== undefined && torrents["1080p"] !== undefined) { %>
                <div class="q720">720p</div>
                <div class="q1080">1080p</div>
                <div class="quality switch white">
                    <input data-toogle="tooltip" data-placement="top" title="720p - <%= Common.fileSize(torrents['720p'].size) %><br>1080p - <%= Common.fileSize(torrents['1080p'].size) %>" type="radio" name="switch" id="switch-hd-off" >
                    <input data-toogle="tooltip" data-placement="top" title="720p - <%= Common.fileSize(torrents['720p'].size) %><br>1080p - <%= Common.fileSize(torrents['1080p'].size) %>" type="radio" name="switch" id="switch-hd-on" checked >
                    <span class="toggle"></span>
                </div>
            <% } else { %>
                <% if (torrents["720p"] !== undefined) { %>
                    <div data-toogle="tooltip" data-placement="top" title="<%= Common.fileSize(torrents['720p'].size) %>" class="q720">720p</div>
                <% }else if (torrents["1080p"] !== undefined) { %>
                    <div data-toogle="tooltip" data-placement="top" title="<%= Common.fileSize(torrents['1080p'].size) %>" class="q720">1080p</div>
                <% } else { %>HDRip<% } %> 
            <% } %>
        </div>
       

	<div style="float:left; max-width: 165px;">
	<div class="sub-dropdown">
          <%= i18n.__("Subtitles") %>
          <div class="sub-flag-icon flag selected-lang none"></div>
          <div class="sub-dropdown-arrow"></div>
        </div>                                            
        <div class="flag-container">
          <div class="sub-flag-icon flag none" data-lang="none" title="<%= i18n.__("Disabled") %>"></div>
          <% for(var lang in subtitle){ %>
              <div class="sub-flag-icon flag <%= lang %>" data-lang="<%= lang %>" title="<%= App.Localization.langcodes[lang].nativeName %>"></div>
           <% } %>
        </div>
	</div>

    </div>
</section>
