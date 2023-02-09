/* eslint-disable */
export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiZWxnbmFzIiwiYSI6ImNsZGx0Y2xqaDAycXAzcG13bXF1OXZjMzMifQ.XfpE-2g1SsSs644GB6WFhg';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/elgnas/cldmmtq4z000d01mqbzytjznm',
    scrollZoom: false,
    // center: [-73.9878584, 40.7484445],
    // zoom: 10,
    // interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create marker html element
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({ offset: 30 })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 200,
      left: 100,
      right: 100,
    },
  });
};
