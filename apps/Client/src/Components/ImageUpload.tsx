import { useRef, useState, type DragEvent } from "react";
import { Camera, ImagePlus, LoaderCircle } from "lucide-react";
import { donationService } from "../API/services/donationService";
import { apiErrorMessage } from "../utils/apiError";
import { cx } from "../utils/format";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

type Props = {
  value: string;
  onChange: (image: { url: string; publicId: string }) => void;
  error?: string;
};

// Photo picker for listings. The file goes to our API, which stores it in
// Cloudinary; the first version uploaded straight from the browser with an
// unsigned preset anyone could reuse. On phones, `capture` offers the camera.
export default function ImageUpload({ value, onChange, error }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!ALLOWED.includes(file.type)) return setLocalError("Use a JPG, PNG or WebP photo.");
    if (file.size > MAX_BYTES) return setLocalError("That photo is over 5 MB. Try a smaller one.");
    setLocalError(null);
    setUploading(true);
    try {
      onChange(await donationService.uploadImage(file));
    } catch (err) {
      setLocalError(apiErrorMessage(err, "The photo didn't upload. Try again."));
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    void upload(event.dataTransfer.files[0]);
  };

  const shownError = localError ?? error;

  return (
    <div>
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cx(
          "relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed transition-colors",
          dragging ? "border-leaf bg-mint" : shownError ? "border-error bg-error-container/40" : "border-forest/15 bg-surface-low hover:border-leaf/50",
        )}
        aria-describedby={shownError ? "photo-error" : undefined}
      >
        {value ? (
          <>
            <img src={value} alt="Your listing photo" className="absolute inset-0 h-full w-full object-cover" />
            <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-forest shadow-card">
              <Camera className="h-3.5 w-3.5" /> Change photo
            </span>
          </>
        ) : (
          <span className="flex flex-col items-center gap-2 px-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-leaf shadow-card">
              <ImagePlus className="h-6 w-6" />
            </span>
            <span className="font-semibold text-forest">Add a photo of the food</span>
            <span className="text-xs text-on-surface-variant">Listings with a clear photo get picked up much faster. JPG, PNG or WebP, up to 5 MB.</span>
          </span>
        )}
        {uploading && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
            <LoaderCircle className="h-7 w-7 text-leaf motion-safe:animate-spin" aria-label="Uploading" />
          </span>
        )}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="sr-only"
        onChange={(event) => {
          void upload(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {shownError && (
        <p id="photo-error" className="mt-1.5 text-xs font-medium text-error" role="alert">
          {shownError}
        </p>
      )}
    </div>
  );
}
