<% function formatBytes(bytes,decimals) {
   if(bytes == 0) return '0 Byte';
   var k = 1000;
   var dm = decimals + 1 || 3;
   var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
   var i = Math.floor(Math.log(bytes) / Math.log(k));
   return (bytes / Math.pow(k, i)).toPrecision(dm) + ' ' + sizes[i];
} %>

<div class="file-selector-container">
    <div class="fa fa-times close-icon"></div>

    <div class="title"><%=i18n.__('Please select a file to play')%></div>
    <div class="content">
        <ul class="file-list">
            <% _.each(files, function(file, index) { 
                    if (file.display !== false) { %>
                <li id="s<%=file.length %>" class="file-item" data-index="<%=file.index%>" data-file="<%=index%>">
                    <a><%=file.name.replace('.[YTS.AG]', '') %> (<%=formatBytes(file.length) %>)</a>
                </li>
            <% }}); %>
        </ul>
    </div>

    <div class="fakeskan"></div>

    <% if (Settings.activateTorrentCollection) { %>
       <div class="button store-torrent"></div>
    <% } %>

    <div class="button dropup" id="player-chooser2"></div>
</div>
