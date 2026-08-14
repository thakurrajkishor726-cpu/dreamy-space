import { useRef, useState } from "react";
import { cloudinaryUrl, uploadImage } from "../lib/cloudinary";

/**
 * Manages one category's image list within a project. Entries are
 * { image_url } — array order is display order, and the first is the cover.
 */
export default function ImageManager({ images = [], onChange, folder }) {
  const [uploads, setUploads] = useState({});
  const [error, setError] = useState("");
  const [dragIndex, setDragIndex] = useState(null);
  const inputRef = useRef(null);

  // Uploads resolve independently, so appends read the latest array rather
  // than the one captured when the batch started — otherwise two concurrent
  // uploads each append to the same stale array and one is lost.
  const imagesRef = useRef(images);
  imagesRef.current = images;

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter((file) => file.type.startsWith("image/"));
    if (!files.length) return;
    setError("");

    await Promise.all(
      files.map(async (file) => {
        const key = `${file.name}-${file.size}`;
        setUploads((current) => ({ ...current, [key]: 0 }));
        try {
          const asset = await uploadImage(file, {
            folder,
            onProgress: (percent) => setUploads((current) => ({ ...current, [key]: percent })),
          });
          onChange([...(imagesRef.current || []), { image_url: asset.url }]);
        } catch (uploadError) {
          setError(uploadError.message);
        } finally {
          setUploads((current) => {
            const next = { ...current };
            delete next[key];
            return next;
          });
        }
      }),
    );

    if (inputRef.current) inputRef.current.value = "";
  };

  const removeImage = (index) => onChange(images.filter((_, i) => i !== index));

  const moveImage = (from, to) => {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const pending = Object.entries(uploads);

  return (
    <div className="image-manager">
      <div
        className="image-manager__dropzone image-manager__dropzone--compact"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          handleFiles(event.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => event.key === "Enter" && inputRef.current?.click()}
      >
        <strong>Drop images here</strong>
        <span>or click to browse</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>

      {pending.length > 0 && (
        <div className="image-manager__progress">
          {pending.map(([key, percent]) => (
            <div className="image-manager__progress-row" key={key}>
              <span>{key.split("-")[0]}</span>
              <progress value={percent} max="100" />
            </div>
          ))}
        </div>
      )}

      {error && <div className="admin-alert admin-alert--error">{error}</div>}

      {images.length > 0 && (
        <ul className="image-grid">
          {images.map((image, index) => (
            <li
              className={`image-grid__item ${dragIndex === index ? "is-dragging" : ""}`}
              key={image.image_url}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragEnd={() => setDragIndex(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null) moveImage(dragIndex, index);
                setDragIndex(null);
              }}
            >
              <img
                src={cloudinaryUrl(image.image_url, { width: 240, height: 180 })}
                alt=""
                loading="lazy"
              />
              {index === 0 && <span className="image-grid__badge">Cover</span>}
              <div className="image-grid__actions">
                <button
                  type="button"
                  onClick={() => moveImage(index, index - 1)}
                  disabled={index === 0}
                  aria-label="Move earlier"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(index, index + 1)}
                  disabled={index === images.length - 1}
                  aria-label="Move later"
                >
                  →
                </button>
                <button
                  type="button"
                  className="is-danger"
                  onClick={() => removeImage(index)}
                  aria-label="Remove"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
