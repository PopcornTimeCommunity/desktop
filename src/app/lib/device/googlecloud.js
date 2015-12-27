(function (App) {

    'use strict';
    var collection = App.Device.Collection;

   var Airplay = App.Device.Generic.extend();

    //if (this.model.get('google_video')) {
	collection.add(new Airplay({
	    id: 'googlecloud',
	    type: 'googlecloud', //icon
	    typeFamily: 'internal',
	    name: 'Google Cloud'
	}));
    //}
	

App.Device.Airplay = Airplay;

})(window.App);
