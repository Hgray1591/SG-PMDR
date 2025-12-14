import { useEffect, useRef } from "react";

interface MediaRendererProps {
  src: string;
  fileType?: string;
  alt: string;
  className?: string;
}

const MediaRenderer = ({
  src,
  fileType,
  alt,
  className = "",
}: MediaRendererProps) => {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (fileType === "image/apng" && imgRef.current) {
      console.log("[MediaRenderer] APNG 로드:", {
        fileType,
        naturalWidth: imgRef.current.naturalWidth,
        naturalHeight: imgRef.current.naturalHeight,
      });
    }
  }, [fileType, src]);

  // WebM은 video 태그로 렌더링
  if (fileType === "video/webm") {
    return (
      <video
        src={src}
        className={className}
        autoPlay
        loop
        muted
        playsInline
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
    );
  }

  // 나머지는 img 태그로 렌더링 (GIF, APNG, PNG, JPG)
  return <img ref={imgRef} src={src} alt={alt} className={className} />;
};

export default MediaRenderer;
