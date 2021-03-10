        var map;
        var marker = null;
        var pos;



        function getLocation() {
           if (navigator.geolocation) {
               navigator.geolocation.getCurrentPosition(position => {
                   pos = {
                       lat: position.coords.latitude,
                       lng: position.coords.longitude
                   }

                   initialize();
               })
           }
           return pos;
         }


         function initialize() {
             var mapOptions = {
                 zoom: 15,
                 disableDefaultUI: true,
                 center: new google.maps.LatLng(pos), //center on sherbrooke
                 mapTypeId: google.maps.MapTypeId.ROADMAP
             };

             $("#coordinate").val(pos.lat + ", " + pos.lng);

             map = new google.maps.Map(document.getElementById('map'), mapOptions);

             google.maps.event.addListener(map, 'click', function(event) {
               //call function to create marker
               $("#coordinate").val(event.latLng.lat() + ", " + event.latLng.lng());
               $("#coordinate").select();

               //delete the old marker
               if (marker) { marker.setMap(null); }

               //creer à la nouvelle emplacement
                marker = new google.maps.Marker({ position: event.latLng, map: map});
             });

         }
         google.maps.event.addDomListener(window, 'load', getLocation);
