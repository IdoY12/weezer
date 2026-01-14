export default function useImageUrl(url: string) {
    return url.startsWith("https")
      ? url
      : `${import.meta.env.VITE_S3_URL}${url}`;
}
