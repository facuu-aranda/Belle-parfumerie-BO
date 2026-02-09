export async function uploadImage(file: File): Promise<string | null> {
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
  data.append("cloud_name", process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!);

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: data }
    );
    const json = await res.json();
    return json.secure_url;
  } catch (error) {
    console.error("Error subiendo imagen:", error);
    return null;
  }
}
