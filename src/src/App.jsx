// CandidateResize.in - Single-file React + Tailwind component
// Save as App.jsx in a React (Vite/CRA) project with Tailwind configured.

import React, { useState, useRef, useCallback } from 'react';
import Cropper from 'react-easy-crop';

// ---------- Utility helpers (canvas cropping + resizing + download) ----------
async function createImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute('crossOrigin', 'anonymous');
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
}

async function getCroppedImage(imageSrc, cropArea, outputWidth, outputHeight, isPNG = false) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext('2d');

  const scaleX = image.naturalWidth / 100;
  const scaleY = image.naturalHeight / 100;

  const sx = cropArea.x * scaleX;
  const sy = cropArea.y * scaleY;
  const sw = cropArea.width * scaleX;
  const sh = cropArea.height * scaleY;

  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, outputWidth, outputHeight);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        const url = URL.createObjectURL(blob);
        resolve({ blob, url });
      },
      isPNG ? 'image/png' : 'image/jpeg',
      isPNG ? 1 : 0.92
    );
  });
}

// ---------- PRESETS ----------
const PRESETS = [
  { id: 'upsc_passport', label: 'UPSC Passport Photo (3.5 x 4.5 cm)', widthCm: 3.5, heightCm: 4.5 },
  { id: 'ssc_signature', label: 'SSC Signature (200 x 60 px)', widthPx: 200, heightPx: 60 },
  { id: 'govt_job_photo', label: 'Standard Govt. Job Photo (2.5 x 2.5 cm)', widthCm: 2.5, heightCm: 2.5 },
];

export default function App() {
  const [imageSrc, setImageSrc] = useState(null);
  const [fileName, setFileName] = useState("");
  const [cropArea, setCropArea] = useState({ x: 10, y: 10, width: 50, height: 50 });
  const [unit, setUnit] = useState("px");
  const [customWidth, setCustomWidth] = useState("");
  const [customHeight, setCustomHeight] = useState("");
  const [preset, setPreset] = useState("");
  const [msg, setMsg] = useState("");
  const fileInputRef = useRef(null);

  function handleFileInput(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result);
      setFileName(file.name.split(".")[0]);
      setMsg("Image loaded. Adjust crop area.");
    };
    reader.readAsDataURL(file);
  }

  function applyPreset(id) {
    const p = PRESETS.find(x => x.id === id);
    setPreset(id);
    if (!p) return;

    if (p.widthPx && p.heightPx) {
      setUnit("px");
      setCustomWidth(p.widthPx);
      setCustomHeight(p.heightPx);
    }

    if (p.widthCm && p.heightCm) {
      setUnit("cm");
      setCustomWidth(p.widthCm);
      setCustomHeight(p.heightCm);
    }
  }

  async function download(format) {
    if (!imageSrc) {
      setMsg("Upload an image first");
      return;
    }

    let w = parseFloat(customWidth);
    let h = parseFloat(customHeight);

    if (unit === "cm") {
      const dpi = 300;
      w = Math.round((w / 2.54) * dpi);
      h = Math.round((h / 2.54) * dpi);
    }

    const { blob, url } = await getCroppedImage(imageSrc, cropArea, w, h, format === "png");

    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.${format}`;
    a.click();

    setMsg(`Downloaded ${fileName}.${format}`);
  }

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center text-blue-700">
        CandidateResize.in – Resize Photo & Signature for SSC, UPSC, RRB
      </h1>

      <p className="text-center text-gray-600 mb-6">
        Upload → Crop → Set Dimensions → Download (JPG/PNG)
      </p>

      <div className="mb-4 flex gap-3 justify-center">
        <button
          onClick={() => fileInputRef.current.click()}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Upload Image
        </button>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      <div className="mb-6">
        <label className="font-semibold">Choose Preset:</label>
        <select
          className="border p-2 ml-2"
          value={preset}
          onChange={(e) => applyPreset(e.target.value)}
        >
          <option value="">Select preset</option>
          {PRESETS.map(p => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <input
          className="border p-2"
          placeholder={`Width (${unit})`}
          value={customWidth}
          onChange={(e) => setCustomWidth(e.target.value)}
        />

        <input
          className="border p-2"
          placeholder={`Height (${unit})`}
          value={customHeight}
          onChange={(e) => setCustomHeight(e.target.value)}
        />
      </div>

      <div className="mb-6">
        <label className="mr-4">
          <input type="radio" checked={unit === "px"} onChange={() => setUnit("px")} /> Pixels
        </label>
        <label>
          <input type="radio" checked={unit === "cm"} onChange={() => setUnit("cm")} /> Centimeters
        </label>
      </div>

      <div className="mb-6 border p-4">
        {imageSrc ? (
          <div>
            <p className="text-sm mb-2 text-gray-500">Adjust crop area below:</p>
            <div className="relative w-full h-64 bg-gray-200">
              <Cropper
                image={imageSrc}
                crop={{ x: cropArea.x, y: cropArea.y }}
                zoom={1}
                aspect={customWidth && customHeight ? customWidth / customHeight : 1}
                onCropChange={(c) => setCropArea(s => ({ ...s, x: c.x, y: c.y }))}
                onCropComplete={(cropAreaPixels, croppedAreaPercentages) =>
                  setCropArea({
                    x: croppedAreaPercentages.x,
                    y: croppedAreaPercentages.y,
                    width: croppedAreaPercentages.width,
                    height: croppedAreaPercentages.height
                  })
                }
              />
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-center">Upload an image to crop</p>
        )}
      </div>

      <div className="flex gap-3 justify-center">
        <button onClick={() => download("jpg")} className="bg-blue-600 text-white px-4 py-2 rounded">
          Download JPG
        </button>

        <button onClick={() => download("png")} className="bg-gray-800 text-white px-4 py-2 rounded">
          Download PNG
        </button>
      </div>

      <p className="mt-4 text-center text-green-700 font-semibold">{msg}</p>
    </div>
  );
}
