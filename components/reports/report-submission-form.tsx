"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { reportCategories } from "@/lib/report-constants";
import {
  createReportSchema,
  type CreateReportInput,
} from "@/schemas/report";
import { LocationPicker } from "@/components/reports/location-picker";

type FieldErrors = Partial<
  Record<"title" | "category" | "description" | "location" | "coordinates", string>
>;

const categoryLabels: Record<(typeof reportCategories)[number], string> = {
  roads: "Roads and sidewalks",
  garbage: "Garbage and litter",
  streetlights: "Streetlights",
  water: "Water",
  drainage: "Drainage",
  other: "Other",
};

const maximumImageSize = 5 * 1024 * 1024;
const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];

function getApiErrorMessage(body: unknown, fallback: string) {
  if (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "object" &&
    body.error !== null &&
    "message" in body.error &&
    typeof body.error.message === "string"
  ) {
    return body.error.message;
  }
  return fallback;
}

function uploadImage(
  file: File,
  onProgress: (progress: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const body = new FormData();
    body.append("image", file);
    const request = new XMLHttpRequest();

    request.open("POST", "/api/reports/upload");
    request.responseType = "json";
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });
    request.addEventListener("load", () => {
      const responseBody: unknown = request.response;
      if (request.status >= 200 && request.status < 300) {
        if (
          typeof responseBody === "object" &&
          responseBody !== null &&
          "imageUrl" in responseBody &&
          typeof responseBody.imageUrl === "string"
        ) {
          resolve(responseBody.imageUrl);
          return;
        }
        reject(new Error("The image upload response was invalid."));
        return;
      }

      reject(
        Object.assign(
          new Error(
            getApiErrorMessage(
              responseBody,
              "We couldn’t upload the image. Please try again.",
            ),
          ),
          { status: request.status },
        ),
      );
    });
    request.addEventListener("error", () => {
      reject(new Error("We couldn’t reach Urbanly to upload the image."));
    });
    request.addEventListener("abort", () => {
      reject(new Error("The image upload was cancelled."));
    });
    request.send(body);
  });
}

export function ReportSubmissionForm() {
  const router = useRouter();
  const submissionStarted = useRef(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [coordinateInputs, setCoordinateInputs] = useState({
    latitude: "",
    longitude: "",
  });
  const [selectedCoordinates, setSelectedCoordinates] = useState<
    [longitude: number, latitude: number] | null
  >(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const previewUrl = useMemo(
    () => (selectedImage ? URL.createObjectURL(selectedImage) : null),
    [selectedImage],
  );

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null;
    setRequestError(null);
    setUploadedImageUrl(null);
    setUploadProgress(0);

    if (
      file &&
      (file.size > maximumImageSize ||
        (file.type !== "" && !allowedImageTypes.includes(file.type)))
    ) {
      setSelectedImage(null);
      event.currentTarget.value = "";
      setRequestError("Choose a JPEG, PNG, or WebP image smaller than 5 MB.");
      return;
    }

    setSelectedImage(file);
  }

  function removeImage() {
    setSelectedImage(null);
    setUploadedImageUrl(null);
    setUploadProgress(0);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  function updateCoordinateInput(
    field: "latitude" | "longitude",
    value: string,
  ) {
    const nextInputs = { ...coordinateInputs, [field]: value };
    setCoordinateInputs(nextInputs);

    if (!nextInputs.latitude.trim() || !nextInputs.longitude.trim()) {
      setSelectedCoordinates(null);
      return;
    }

    const latitude = Number(nextInputs.latitude);
    const longitude = Number(nextInputs.longitude);

    setSelectedCoordinates(
      Number.isFinite(latitude) && Number.isFinite(longitude)
        ? [longitude, latitude]
        : null,
    );
  }

  function updateSelectedCoordinates(
    coordinates: [longitude: number, latitude: number] | null,
  ) {
    setSelectedCoordinates(coordinates);
    setCoordinateInputs(
      coordinates
        ? {
            latitude: String(coordinates[1]),
            longitude: String(coordinates[0]),
          }
        : { latitude: "", longitude: "" },
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionStarted.current) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const latitudeText = coordinateInputs.latitude.trim();
    const longitudeText = coordinateInputs.longitude.trim();
    const errors: FieldErrors = {};

    if (Boolean(latitudeText) !== Boolean(longitudeText)) {
      errors.coordinates = "Enter both latitude and longitude, or leave both blank.";
    }

    let location: CreateReportInput["location"] = {
      address: String(formData.get("address") ?? ""),
    };

    if (latitudeText && longitudeText) {
      const latitude = Number(latitudeText);
      const longitude = Number(longitudeText);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        errors.coordinates = "Latitude and longitude must be valid numbers.";
      } else {
        location = {
          address: location.address,
          type: "Point",
          coordinates: selectedCoordinates ?? [longitude, latitude],
        };
      }
    }

    const parsed = createReportSchema.safeParse({
      title: formData.get("title"),
      category: formData.get("category"),
      description: formData.get("description"),
      location,
    });

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const path = issue.path[0];
        if (
          path === "location" &&
          issue.path[1] === "coordinates"
        ) {
          errors.coordinates ??= issue.message;
          continue;
        }
        if (
          path === "title" ||
          path === "category" ||
          path === "description" ||
          path === "location"
        ) {
          errors[path] ??=
            path === "location" ? "Enter a valid location address." : issue.message;
        }
        if (issue.path[0] === "location" && issue.path[1] === "coordinates") {
          errors.coordinates ??= issue.message;
        }
      }
    }

    setFieldErrors(errors);
    setRequestError(null);

    if (!parsed.success || Object.keys(errors).length > 0) {
      return;
    }

    setPending(true);
    submissionStarted.current = true;

    try {
      let imageUrl = uploadedImageUrl;

      if (selectedImage && !imageUrl) {
        setUploading(true);
        imageUrl = await uploadImage(selectedImage, setUploadProgress);
        setUploadedImageUrl(imageUrl);
        setUploading(false);
      }

      const report = createReportSchema.safeParse({
        ...parsed.data,
        ...(imageUrl ? { imageUrl } : {}),
      });

      if (!report.success) {
        setRequestError("The uploaded image could not be attached to your report.");
        return;
      }

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report.data),
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        setRequestError(
          getApiErrorMessage(
            body,
            "We couldn’t submit your report. Please try again.",
          ),
        );
        return;
      }

      setSubmitted(true);
      form.reset();
      setCoordinateInputs({ latitude: "", longitude: "" });
      setSelectedCoordinates(null);
      setSelectedImage(null);
      setUploadedImageUrl(null);
    } catch (error) {
      if (
        error instanceof Error &&
        "status" in error &&
        error.status === 401
      ) {
        router.replace("/login");
        return;
      }

      setRequestError(
        error instanceof Error
          ? error.message
          : "We couldn’t reach Urbanly. Check your connection and try again.",
      );
    } finally {
      setUploading(false);
      submissionStarted.current = false;
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen flex-1 bg-[#f5f8f5] px-4 py-8 text-slate-950 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <Link
          className="inline-flex min-h-10 items-center rounded-lg text-sm font-medium text-emerald-900 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-800"
          href="/dashboard"
        >
          ← Back to dashboard
        </Link>
        <section className="mt-5 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-8 lg:p-10">
          <p className="text-sm font-semibold text-emerald-800">Make a difference nearby</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Report an issue
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Share what needs attention in your community. Add a clear address so
            the right people can find it.
          </p>

          {submitted ? (
            <div
              aria-live="polite"
              className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6"
              role="status"
            >
              <h2 className="text-lg font-semibold text-emerald-950">
                Your report has been submitted
              </h2>
              <p className="mt-2 text-sm leading-6 text-emerald-900">
                Thank you for helping improve your neighborhood. You can follow
                its status from My Reports.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
                  href="/reports/mine"
                >
                  View My Reports
                </Link>
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-900/20 px-4 text-sm font-semibold text-emerald-950 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
                  href="/dashboard"
                >
                  Go to dashboard
                </Link>
              </div>
            </div>
          ) : (
            <form
              aria-busy={pending}
              className="mt-8 space-y-6"
              noValidate
              onSubmit={handleSubmit}
            >
              <div>
                <label className="mb-2 block text-sm font-semibold" htmlFor="title">
                  Title <span aria-hidden="true" className="text-rose-700">*</span>
                </label>
                <input
                  aria-describedby={fieldErrors.title ? "title-error" : "title-help"}
                  aria-invalid={Boolean(fieldErrors.title)}
                  autoComplete="off"
                  className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base outline-none transition placeholder:text-slate-400 focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/15"
                  id="title"
                  maxLength={120}
                  name="title"
                  required
                />
                <FieldError id="title-error" message={fieldErrors.title} />
                {!fieldErrors.title && (
                  <p className="mt-1.5 text-xs text-slate-500" id="title-help">
                    Use 5–120 characters to describe the issue.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold" htmlFor="category">
                  Category <span aria-hidden="true" className="text-rose-700">*</span>
                </label>
                <select
                  aria-describedby={fieldErrors.category ? "category-error" : undefined}
                  aria-invalid={Boolean(fieldErrors.category)}
                  className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/15"
                  defaultValue=""
                  id="category"
                  name="category"
                  required
                >
                  <option disabled value="">
                    Select a category
                  </option>
                  {reportCategories.map((category) => (
                    <option key={category} value={category}>
                      {categoryLabels[category]}
                    </option>
                  ))}
                </select>
                <FieldError id="category-error" message={fieldErrors.category} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold" htmlFor="description">
                  Description <span aria-hidden="true" className="text-rose-700">*</span>
                </label>
                <textarea
                  aria-describedby={fieldErrors.description ? "description-error" : "description-help"}
                  aria-invalid={Boolean(fieldErrors.description)}
                  className="min-h-36 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition placeholder:text-slate-400 focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/15"
                  id="description"
                  maxLength={2000}
                  name="description"
                  required
                  rows={5}
                />
                <FieldError id="description-error" message={fieldErrors.description} />
                {!fieldErrors.description && (
                  <p className="mt-1.5 text-xs text-slate-500" id="description-help">
                    Include useful details (10–2,000 characters).
                  </p>
                )}
              </div>

              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold">
                  Location <span aria-hidden="true" className="text-rose-700">*</span>
                </legend>
                <div>
                  <label className="mb-2 block text-sm font-medium" htmlFor="address">
                    Street address or nearby landmark
                  </label>
                  <input
                    aria-describedby={fieldErrors.location ? "location-error" : undefined}
                    aria-invalid={Boolean(fieldErrors.location)}
                    autoComplete="street-address"
                    className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base outline-none transition placeholder:text-slate-400 focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/15"
                    id="address"
                    maxLength={300}
                    name="address"
                    required
                  />
                  <FieldError id="location-error" message={fieldErrors.location} />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium">
                    Coordinates <span className="font-normal text-slate-500">(optional)</span>
                  </p>
                  <LocationPicker
                    coordinates={selectedCoordinates}
                    onCoordinatesChange={updateSelectedCoordinates}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm text-slate-700" htmlFor="latitude">
                        Latitude
                      </label>
                      <input
                        aria-describedby={fieldErrors.coordinates ? "coordinates-error" : undefined}
                        aria-invalid={Boolean(fieldErrors.coordinates)}
                        className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base outline-none transition placeholder:text-slate-400 focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/15"
                        id="latitude"
                        max="90"
                        min="-90"
                        name="latitude"
                        onChange={(event) =>
                          updateCoordinateInput("latitude", event.target.value)
                        }
                        placeholder="e.g. 40.7128"
                        step="any"
                        value={coordinateInputs.latitude}
                        type="number"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-slate-700" htmlFor="longitude">
                        Longitude
                      </label>
                      <input
                        aria-describedby={fieldErrors.coordinates ? "coordinates-error" : undefined}
                        aria-invalid={Boolean(fieldErrors.coordinates)}
                        className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base outline-none transition placeholder:text-slate-400 focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/15"
                        id="longitude"
                        max="180"
                        min="-180"
                        name="longitude"
                        onChange={(event) =>
                          updateCoordinateInput("longitude", event.target.value)
                        }
                        placeholder="e.g. -74.0060"
                        step="any"
                        value={coordinateInputs.longitude}
                        type="number"
                      />
                    </div>
                  </div>
                  <FieldError id="coordinates-error" message={fieldErrors.coordinates} />
                  <p className="mt-1.5 text-xs text-slate-500">
                    You can select a point on the map or enter both values.
                    Coordinates are submitted in GeoJSON order: longitude, latitude.
                  </p>
                </div>
              </fieldset>

              <div>
                <label
                  className="mb-2 block text-sm font-semibold"
                  htmlFor="report-image"
                >
                  Photo <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="block min-h-12 w-full cursor-pointer rounded-xl border border-slate-300 bg-white text-sm text-slate-700 file:mr-4 file:min-h-12 file:border-0 file:bg-emerald-50 file:px-4 file:text-sm file:font-semibold file:text-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={pending}
                  id="report-image"
                  name="image"
                  onChange={handleImageChange}
                  ref={imageInputRef}
                  type="file"
                  aria-describedby="report-image-help"
                />
                <p className="mt-1.5 text-xs text-slate-500" id="report-image-help">
                  JPEG, PNG, or WebP. Maximum file size: 5 MB.
                </p>
                {selectedImage && previewUrl && (
                  <div className="mt-4 max-w-sm rounded-xl border border-slate-200 p-3">
                    <Image
                      alt={`Preview of ${selectedImage.name}`}
                      className="h-auto max-h-64 w-full rounded-lg object-contain"
                      height={480}
                      src={previewUrl}
                      unoptimized
                      width={640}
                    />
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="truncate text-xs text-slate-600">
                        {selectedImage.name}
                      </p>
                      <button
                        className="min-h-9 shrink-0 rounded-lg px-3 text-sm font-semibold text-rose-800 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-800 disabled:opacity-60"
                        disabled={pending}
                        onClick={removeImage}
                        type="button"
                      >
                        Remove photo
                      </button>
                    </div>
                  </div>
                )}
                {uploading && (
                  <div className="mt-4" aria-live="polite">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Uploading photo…</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <progress
                      aria-label="Photo upload progress"
                      className="mt-2 h-2 w-full accent-emerald-800"
                      max={100}
                      value={uploadProgress}
                    />
                  </div>
                )}
              </div>

              {requestError && (
                <p
                  aria-live="assertive"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
                  role="alert"
                >
                  {requestError}
                </p>
              )}

              <button
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-800 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                disabled={pending}
                type="submit"
              >
                {uploading
                  ? "Uploading photo…"
                  : pending
                    ? "Submitting report…"
                    : "Submit report"}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-sm text-rose-800" id={id} role="alert">
      {message}
    </p>
  );
}
