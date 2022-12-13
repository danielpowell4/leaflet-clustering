import * as React from "react";
import { Map, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import useSupercluster from "use-supercluster";
import "./App.css";

import data from "./data.json";
import useFilters from "./useFilters";
import FilterForm from "./FilterForm";

const icons = {};
const fetchIcon = (count, size) => {
  if (!icons[count]) {
    icons[count] = L.divIcon({
      html: `<div class="cluster-marker" style="width: ${size}px; height: ${size}px;">
        ${count}
      </div>`,
    });
  }
  return icons[count];
};

const DEFAULT_CENTER = [40.721058, -73.87687];

const filterTemplate = [
  {
    label: "LOCATION",
    filterKey: "locations",
    type: "checkbox",
    optionKeys: ["locations"],
  },
  {
    label: "SEMESTER",
    filterKey: "semesters",
    type: "checkbox",
    optionValueKeys: ["semesters"],
  },
];

const asCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",

  // These options are needed to round to whole numbers if that's what you want.
  //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
  //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
});

const App = () => {
  const [bounds, setBounds] = React.useState(null);
  const [zoom, setZoom] = React.useState(11);
  const mapRef = React.useRef();
  function updateMap() {
    const b = mapRef.current.leafletElement.getBounds();
    setBounds([
      b.getSouthWest().lng,
      b.getSouthWest().lat,
      b.getNorthEast().lng,
      b.getNorthEast().lat,
    ]);
    setZoom(mapRef.current.leafletElement.getZoom());
  }

  React.useEffect(updateMap, []);

  const [filters, activeFilter, filteredData] = useFilters(
    filterTemplate,
    data
  );

  const points = filteredData.map((d) => ({
    type: "Feature",
    properties: { cluster: false, pointId: d.student_id },
    geometry: {
      type: "Point",
      coordinates: [d.long, d.lat],
    },
  }));

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom,
    options: { radius: 100, maxZoom: 17 },
  });

  return (
    <div className="App">
      <details>
        <summary>Filters</summary>
        <FilterForm filters={filters} activeFilter={activeFilter} />
      </details>

      <details open>
        <summary>Summary</summary>
        <ul>
          <li>
            <strong>Unique Students</strong> {filteredData.length}
          </li>
          <li>
            <strong>Total Rev</strong>{" "}
            {asCurrency.format(
              filteredData.reduce(
                (acc, item) => acc + parseFloat(item.revenue),
                0
              )
            )}
          </li>
          <li>
            <strong>Total Sessions</strong>{" "}
            {filteredData.reduce(
              (acc, item) => acc + parseFloat(item.sessions),
              0
            )}
          </li>
        </ul>
      </details>

      <Map
        center={DEFAULT_CENTER}
        zoom={zoom}
        onMoveEnd={updateMap}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />

        {clusters.map((cluster) => {
          // every cluster point has coordinates
          const [longitude, latitude] = cluster.geometry.coordinates;
          // the point may be either a cluster or a crime point
          const { cluster: isCluster, point_count: pointCount } =
            cluster.properties;

          // we have a cluster to render
          if (isCluster) {
            return (
              <Marker
                key={`cluster-${cluster.id}`}
                position={[latitude, longitude]}
                icon={fetchIcon(
                  pointCount,
                  10 + (pointCount / points.length) * 40
                )}
                onClick={() => {
                  const expansionZoom = Math.min(
                    supercluster.getClusterExpansionZoom(cluster.id),
                    17
                  );
                  const leaflet = mapRef.current.leafletElement;
                  leaflet.setView([latitude, longitude], expansionZoom, {
                    animate: true,
                  });
                }}
              />
            );
          }

          // we have a single point to render
          return (
            <Marker
              key={`student-${cluster.properties.pointId}`}
              position={[latitude, longitude]}
              // icon={cuffs}
            />
          );
        })}
      </Map>
    </div>
  );
};

export default App;
