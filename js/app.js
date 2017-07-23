'use strict';

// basic data that will be loaded up on the map
// 5 locations in Boulder, CO that I liked in college
const locs = [{
    title: 'The Spot Bouldering Gym',
    latlng: {lat: 40.0215272, lng: -105.2505871},
    image: 'rock climbing'
  },
  {
    title: 'Sherpa\'s Restaurant',
    latlng: {lat: 40.0161644, lng: -105.2844167},
    image: 'sherpa'
  },
  {
    title: 'Hapa Sushi',
    latlng: {lat: 40.018009, lng: -105.2505871},
    image: 'sushi'
  },
  {
    title: 'Boulder Creek',
    latlng: {lat: 40.0145327, lng: -105.2821675},
    image: 'boulder creek'
  },
  {
    title: 'The CU Engineering Center',
    latlng: {lat: 40.0071656, lng: -105.2627072},
    image: 'engineering'
}];

function Location(data) {
  this.title = data.title;
  this.latlng = data.latlng;
  // markers are assigned later
  this.marker = null;
  this.selected = ko.observable(false);
  this.filtered = ko.observable(false);
  this.image = data.image;
};

function MapViewModel() {
  this.map = null;
  this.center = {lat: 40.02, lng: -105.27};
  this.city = 'Boulder';
  this.locations = ko.observableArray([]);

  locs.forEach((loc) => {
    this.locations().push(new Location(loc));
  });

  this.addLocationMarkers = () => {
    this.locations().forEach((loc) => {
      loc.map = this.map;

      loc.marker = new google.maps.Marker({
        position: loc.latlng,
        animation: google.maps.Animation.DROP,
        title: loc.title
      });
      loc.marker.setMap(loc.map);

      loc.marker.addListener('click', () => {
        this.selectPlace(loc);
      });

      this.fetchImage(loc);
    });
  };

  this.fetchImage = (loc) => {
    fetch(`https://pixabay.com/api/?key=1553410-5d96ab654addbe62ddd7d6b2a&q=${encodeURIComponent(loc.image)}`).then(res => {
      return res.json()
    }).then((json) => {
      this.buildInfoWindow(json, loc)
    }).catch(() => {
      this.buildInfoWindow('error', loc)
    })

  };

  this.buildInfoWindow = (data, loc) => {
    // check to see if data indicates there was an error loading.
    if (typeof data == 'string'){
      loc.infowindow = new google.maps.InfoWindow({
        content: `Sorry, an image for ${loc.title} could not be loaded`
      });

      loc.infowindow.addListener('closeclick', () => {
        this.selectPlace(loc);
      });
      return;
    }
    const imageUrl = data.hits[0].webformatURL;

    // if there were no errors:
    const infoHtml = `
      <div class="info-window">
        <h2>${loc.title}</h2>
        <img src="${imageUrl}">
        <span>image courtesy of Pixabay</span>
      </div>
    `;

    loc.infowindow = new google.maps.InfoWindow({
      content: infoHtml
    });

    loc.infowindow.addListener('closeclick', () => {
      this.selectPlace(loc);
    });

  };

  this.selectPlace = (loc) => {
  // first, deselect other places
    for (let i in this.locations()){
      if (this.locations()[i] != loc &&
          this.locations()[i].selected) {
        this.locations()[i].selected(false);
        this.locations()[i].infowindow.close();
        this.locations()[i].marker.setAnimation(null);
      }
    }
    if (loc.selected()) {
      loc.selected(false);
      loc.infowindow.close();
      loc.marker.setAnimation(null);
    } else {
      loc.selected(true);
      loc.infowindow.open(loc.map, loc.marker);
      loc.marker.setAnimation(google.maps.Animation.BOUNCE);
    }
  };

  this.query = ko.observable('');

  this.filter = (value) => {
    // modified from this helpful post: http://opensoul.org/2011/06/23/live-search-with-knockoutjs/

    // if they match search terms, make them visible

    for (let i in locs) {
      if (locs[i].title.toLowerCase().indexOf(value.toLowerCase()) >= 0) {
        this.locations()[i].filtered(false);
        this.locations()[i].marker.setMap(this.map);
      } else {
        this.locations()[i].filtered(true);
        this.locations()[i].marker.setMap(null);
      }
    }
  };
};

const MapView = new MapViewModel();
MapView.query.subscribe(MapView.filter);
ko.applyBindings(MapView);


function initMap() {
  MapView.map = new google.maps.Map(document.getElementById('map'), {
    center: MapView.center,
    zoom: 14
  });

  MapView.addLocationMarkers();
}

