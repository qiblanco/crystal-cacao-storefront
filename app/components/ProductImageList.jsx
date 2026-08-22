import {Image} from '@shopify/hydrogen';
import {useState, useEffect} from 'react';
import {createPortal} from 'react-dom';

export function ProductImageList({images, onSelectImage}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFeatured, setModalFeatured] = useState(null);

  if (!images?.nodes?.length) return null;

  const allImages = images.nodes;
  const hasMore = allImages.length > 4;
  const thumbnails = hasMore ? allImages.slice(0, 4) : allImages;

  function openModal(startImage) {
    setModalFeatured(startImage);
    setModalOpen(true);
  }

  function handleModalSelect(image) {
    setModalFeatured(image);
    onSelectImage?.(image);
  }

  return (
    <>
      <div className="product-image-list">
        {thumbnails.map((image, index) => (
          <Image
            key={image.id}
            data={image}
            alt={image.altText || ''}
            aspectRatio="1/1"
            onClick={() => onSelectImage?.(image)}
            sizes="(min-width: 1024px) 15vw, 25vw"
            className="thumb-image"
            loading={index === 0 ? 'eager' : 'lazy'}
          />
        ))}
        {hasMore && (
          <button
            className="ImageSeeMore"
            onClick={() => openModal(allImages[4])}
            aria-label="Alle Bilder anzeigen"
          >
            <div className="imageOverlay">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1.5em"
                height="1.5em"
                viewBox="0 0 24 24"
              >
                <path fill="#fff" d="M19 12.998h-6v6h-2v-6H5v-2h6v-6h2v6h6z" />
              </svg>
              <span>+{allImages.length - 4}</span>
            </div>
            <Image
              data={allImages[4]}
              alt={allImages[4].altText || ''}
              aspectRatio="1/1"
              sizes="(min-width: 1024px) 15vw, 25vw"
              className="thumb-image"
            />
          </button>
        )}
      </div>

      {modalOpen && (
        <ImageGalleryModal
          images={allImages}
          featuredImage={modalFeatured}
          onSelectImage={handleModalSelect}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

function ImageGalleryModal({images, featuredImage, onSelectImage, onClose}) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return createPortal(
    <div className="ImageGalleryModal" onClick={onClose}>
      <div
        className="ImageGalleryModal__inner"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="ImageGalleryModal__close"
          onClick={onClose}
          aria-label="Schließen"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="1.5em"
            height="1.5em"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
            />
          </svg>
        </button>

        <div className="ImageGalleryModal__featured">
          {featuredImage && (
            <Image
              data={featuredImage}
              alt={featuredImage.altText || ''}
              sizes="(min-width: 768px) 70vw, 90vw"
              className="ImageGalleryModal__featured-img"
            />
          )}
        </div>

        <div className="ImageGalleryModal__thumbs">
          {images.map((image) => (
            <button
              key={image.id}
              className={`ImageGalleryModal__thumb${
                featuredImage?.id === image.id ? ' active' : ''
              }`}
              onClick={() => onSelectImage(image)}
            >
              <Image
                data={image}
                alt={image.altText || ''}
                aspectRatio="1/1"
                sizes="120px"
              />
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
