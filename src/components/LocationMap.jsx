import { useState } from "react";
import { FiExternalLink, FiMapPin, FiNavigation } from "react-icons/fi";
import { COMPANY, directionsUrl, mapEmbedUrl } from "../data/company";

/**
 * The studio on a map, beside the address.
 *
 * The iframe is not mounted until it is asked for. A Google Maps embed pulls
 * roughly a megabyte and sets third-party cookies, and this sits low on the
 * contact page — loading it on every visit would be paid for by people who
 * never scroll to it. The placeholder shows the address and both links, so
 * the section is useful whether or not anyone opens the map.
 */
export default function LocationMap({ compact = false }) {
  const [shown, setShown] = useState(false);

  return (
    <div className={`ds-map ${compact ? "ds-map--compact" : ""}`}>
      <div className="ds-map__frame">
        {shown ? (
          <iframe
            title={`Map showing ${COMPANY.name}`}
            src={mapEmbedUrl}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <button type="button" className="ds-map__placeholder" onClick={() => setShown(true)}>
            <span className="ds-map__pin" aria-hidden="true">
              <FiMapPin />
            </span>
            <span className="ds-map__placeholder-title">Show the map</span>
            <span className="ds-map__placeholder-note">
              Loads Google Maps, which sets its own cookies.
            </span>
          </button>
        )}
      </div>

      <div className="ds-map__body">
        <address className="ds-map__address">
          {COMPANY.addressLines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </address>

        <div className="ds-map__actions">
          <a className="btn-clay btn-sm-pill" href={directionsUrl} target="_blank" rel="noreferrer">
            <FiNavigation aria-hidden="true" />
            Directions
          </a>
          <a className="ds-link" href={COMPANY.mapsUrl} target="_blank" rel="noreferrer">
            Open in Maps
            <FiExternalLink aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}
