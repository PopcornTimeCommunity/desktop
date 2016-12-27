(function (App) {

    'use strict';
    var collection = App.Device.Collection;

   var Airplay = App.Device.Generic.extend({
	   stop: function () {},
   });

    //if (this.model.get('google_video')) {
	collection.add(new Airplay({
	    id: 'html5',
	    type: 'html5', //icon
	    typeFamily: 'internal',
	    name: 'HTML5 Video'
	}));
    //}
	

App.Device.Airplay = Airplay;

})(window.App);
