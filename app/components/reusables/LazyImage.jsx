import { useEffect, useRef, useState } from "react";

export default function LazyImage({ compressedLink, highQualityLink, alt="image" }) {
  const [isSeen, setIsSeen] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!imgRef.current || isSeen) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsSeen(true);
        observer.disconnect();
      }
    });

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [isSeen]);

  return (
    <img
      ref={imgRef}
      src={isSeen ? highQualityLink : compressedLink}
      loading="lazy"
      alt={alt}
    />
  );
}