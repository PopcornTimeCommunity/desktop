[Warning! Popcorntime.sh /io now owned by MPAA](https://github.com/PopcornTime-CE/desktop/issues/41#issuecomment-185913581)

# [Popcorn Time Community](https://github.com/PopcornTime-CE/desktop)

Allow anyone to easily watch their favorite movies, shows, and anime.

![Popcorn Time](src/app/images/icon.png)

Visit the project's website at <http://popcorntime.ag>.

This project would absolutely **not** be possible without the original developer's hard work into making Popcorn Time what it is today. All credit should go to them, we're just trying to help the community :)

***

## Getting Involved

Want to report a bug, request a feature, contribute or translate Popcorn Time? We need all the help we can get! You can also join in with our [community](README.md#community) to keep up-to-date and meet other Popcorn Timers.

## Getting Started

If you're comfortable getting up and running from a `git clone`, this method is for you.

If you clone the GitLab repository, you will need to build a number of assets with npm.

The [master](https://github.com/PopcornTime-CE/desktop/tree/master) branch which contains the latest release.

#### Requirements

1. You must have git installed
2. You must have npm installed

#### Running
*Runs the app without building, useful for testing*

1. `git clone https://github.com/PopcornTime-CE/desktop.git`
1. `cd desktop`
1. `npm install`
1. `npm start`

#### How to fix error: The video could not be loaded, either because the server or network failed or because the format is not supported

1. Go to your popcorntime directory `desktop` and paste/replace [libffmpegsumo.so](http://www33.zippyshare.com/v/4UZX7pu4/file.html) in it.

#### Building
*Builds the app for a packaged, runnable app*

1. `npm install`
1. `gulp build` **OR** `node_modules/.bin/gulp build` depending whether you have gulp installed globally or not. 
  2. You can also build for different platforms by passing them with the `-p` argument as a comma-seperated list (For example: `gulp build -p osx64,win32`
1. There should be a `build/` directory containing the built files 
 
<a name="community"></a>
## Community

Keep track of Popcorn Time Community development and community activity.

* Join in discussions on the [Popcorn Time CE Forum](http://reddit.com/r/PopcornTimeCE)
* Visit the [website](http://popcorntime.ag)

# What is the Google Cloud Player?

Google Cloud (Cloud “Torrent”) is a revolutionary new way to exchange movies with the power of Google's Infrastructure. Think of Google Cloud as a cloud torrent in which the cloud system uploads the file to the Cloud with many copies and different links. Every viewer gets a unique link to the cloud source, where he/she can watch the movie.

Those unique links have also the ability to expire at any time, so it's not possible to correctly identify the source file, as takedown notice suggests. This prevents the files from being removed by DCMA bots and has many distinct advantages. 

Of those who had used PopcornTime Player and GoogleCloud Player, the majority preferred the GoogleCloud Player. The new player has many specific advantages over many other competitors, as highlighted below:

&nbsp;

 | GoogleCloud Player | PopcornTime Player
 :--|:--:|--:
Infrastructure | Google Cloud (Cloud “Torrent”) | P2P
Speed | Very Fast | [Potentially Throttled](https://en.wikipedia.org/wiki/Bandwidth_throttling)
ISP Monitor Traffic | Nearly Impossible (SSL) | Very Likely (built-in VPN is slow)
Seeder (Upload Bandwidth) | Initial Upload Only | Seed While Watching
Download Bandwidth | No Restrictions | Limited by Seeders
Leecher Impact | No Impact | Direct Impact
Selection | 263,000+ mirrors | [YTS](http://yify.is)
TV Shows | Coming Soon! | Most
Subtitles | Yes | Yes
Mobile Downloading | Yes | Yes
Mobile Streaming | Yes | Yes
Android App | Coming Soon! | Yes
Change Playback Quality | Coming Soon! | Yes
Xbox/Playstation Compatible | Yes | No
Software Requirements | None Needed | Windows/Mac/Linux
Chromecast Support | Coming Soon! | Yes
Advertising | None | None
Bloat/File Advertising | None | Often
Release Updates | Usually 1 day late | [YIFY-dependent](http://yify.is/index.php/movie/yifi_filter)

&nbsp;

Official Download Sites:

* http://popcorntime.ag

* https://www.reddit.com/r/PopcornTimeCE/comments/3xa881/downloads/

# Who should use Google Cloud?

You should use Google Cloud if:

1. You want the highest level of security and safety. Unlike a traditional torrent, Google Cloud does not log or share your IP address with other users. The list of mirrors are encrypted, and the files are downloaded through Google directly, which has a built-in antivirus scanner. Only the direct file (MP4, MKV, AVI, etc) file can be shared through Google Cloud Player, so no viruses can possibly be downloaded through Google Cloud. Torrents are prone to spreading viruses, bloatware, malware, and fake files, and PopcornTime often downloads bloat.

2. You want to conserve bandwidth and desire super-fast speed. In many countries, the upload speeds are significantly slower than download speeds. Google Cloud ditches the traditional seeder and leecher system and leaves Google to do the dirty work, and they have so much bandwidth that the speed is nearly limitless. Download at the fastest possible speed even during periods of high demand. Seeders only need to choose the Google Cloud Player instead of the built in one, you can do so by clicking the allocated icon on the '*Watch*' button. A list of your installed player will be shown, select Google Cloud and Popcorn Time will send everything to it, and no other setting is needed. No more upload ratios!

3. You want to stream the Google Cloud instantly across multiple platforms. While there are ways to stream Google Cloud from torrents, it is often very difficult, very restrictive, and requires special software. [Video2k.is](http://Video2k.is) website allows instant streaming from Google Cloud using the new HTML5 player. This ensures compatibility with all mobile devices and many gaming services, including the Xbox and Playstation browsers, but PopcornTime must be used within the software.

4. You want the most convenience and ease-of-use. As Android and Apple teach us, appearance and convenience matter. While Video2k’s layout may not win the best-website-of-the-year award, it certainly looks modern and is extremely easy to use across all browsers. You just search for a movie, click on it, and click on the specific video file that you would like. It’s honestly that simple.

&nbsp;

# Google Cloud FAQ

* **Should I use any sort of internet protection while using Google Cloud?**  
It is nearly impossible for an Internet Service Provider to know that you are streaming movies through Google. That being said, according to http://www.pcworld.com/article/2973556/streaming-media/popcorn-time-users-are-now-getting-sued-by-the-movie-industry.html, Tens of thousands of Popcorn Time movie streamers are now getting sued by the movie industry. These users should be safe with the built-in Google Cloud Player. At Popcorn Time Community, we put security first!

* **Why was this project created?**  
It was originally created as a proof of concept, but it became a large project as the MPAA surprisingly shut down yts.to and popcorntime.io at the same time. This project shall continue as far as we have the support and community for it.

## Versioning

For transparency and insight into our release cycle, and for striving to maintain backward compatibility, Popcorn Time will be maintained according to the [Semantic Versioning](http://semver.org/) guidelines as much as possible.

Releases will be numbered with the following format:

`<major>.<minor>.<patch>-<build>`

Constructed with the following guidelines:

* A new *major* release indicates a large change where backwards compatibility is broken.
* A new *minor* release indicates a normal change that maintains backwards compatibility.
* A new *patch* release indicates a bugfix or small change which does not affect compatibility.
* A new *build* release indicates this is a pre-release of the version.

***

If you distribute a copy or make a fork of the project, you have to credit this project as source.
	
This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 
This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.
 
You should have received a copy of the GNU General Public License along with this program.  If not, see http://www.gnu.org/licenses/ .

***

**This project and the distribution of this project is not illegal, nor does it violate *any* DMCA laws. The use of this project, however, may be illegal in your area. Check your local laws and regulations regarding the use of torrents to watch potentially copyrighted content. The maintainers of this project do not condone the use of this project for anything illegal, in any state, region, country, or planet. *Please use at your own risk*.**

***

If you want to contact us : send pm to [samewhiterabbits](https://www.reddit.com/user/Samewhiterabbits) on reddit or [use the form](http://yify.is/index.php/blog/contact) on the yify website.
 
Copyright (c) 2015 Popcorn Time Community - Released under the [GPL v3 license](LICENSE.txt).
