import {Image} from '@shopify/hydrogen';
import {useState, useEffect} from 'react';
import {createPortal} from 'react-dom';

/*
 * Breite der Vorschaubilder, gemessen statt geschätzt (2026-09-27, 16
 * Fenster von 360x740 bis 2560x1440, qiblanco.com und crystal-cacao.com,
 * Zwilling gegen origin/main):
 *   bis 749 px     eine Zeile, je Bild 17-19 % der Fensterbreite
 *   720-749 px     zweispaltig, je Bild rund 9 %
 *   750-1023 px    25 % der Fensterbreite
 *   ab 1024 px     Spalte neben dem Hauptbild, siehe unten
 *
 * AB 1024 PX BESTIMMT DIESE ANGABE DAS LAYOUT MIT, nicht nur die Datei. Die
 * Spalte (.product-image-list, flex: none, width: auto) ist so breit wie die
 * Eigenbreite ihrer Bilder, und die ist bei srcset mit w-Angaben genau der
 * sizes-Wert. Vorher 15vw: bei 1440 px eine 216 px breite Spalte für 89 px
 * Bilder (127 px leer), der Browser zog die 400er-Datei (4,5-4,95x). Die
 * Bilder selbst sind hoch begrenzt: (Hauptbildhöhe - 4 Lücken à 8 px) / 5.
 * Der Wert unten ist der Punkt, an dem Spalte und Bild gleich breit sind:
 * Galeriebreite W = 52,38vw - 41,9 px (gemessen 1024-2560), Bild = (W - 52) / 6.
 * Auf crystal-cacao.com ist W kleiner; die Spalte behält dort ein paar
 * Pixel Luft, die Datei ist nie zu klein. Wer das CSS der Galerie ändert,
 * misst diesen Wert neu (Probe: homepage-bauer/pruefungen/
 * probe_galerie_lcp_und_vorschau.py).
 * Die Hydrogen-Leiter beginnt sonst bei 200 px; in 100er-Schritten bekommt
 * ein 110-px-Bild die 200er statt der 400er.
 */
const VORSCHAU_SIZES =
  '(min-width: 1024px) calc(8.73vw - 15.6px), (min-width: 750px) 25vw, (min-width: 45em) 9.5vw, 20vw';
const VORSCHAU_SRCSET = {
  intervals: 8,
  startingWidth: 100,
  incrementSize: 100,
  placeholderWidth: 100,
};

/**
 * VIDEO-KACHEL (additiv, Default null): eine Kaufseite kann eine Kachel in
 * den Streifen geben (components/reusables/ProduktVideos.jsx, Maßnahme
 * „Produktseite, die verkauft“, Grossjob growth-m-lp-produktseite-verkauft).
 * Sie ERSETZT dann eine Bild-Kachel: drei Bilder, die Video-Kachel, „+N“.
 * Der Streifen behält seine Kachelzahl und damit seine Höhe, die Kaufbox
 * rückt nicht (design-qa Q2-buybox-fold); das vierte Bild bleibt über „+N“
 * erreichbar. Ohne Prop rendert der Streifen byte-gleich wie zuvor.
 */
export function ProductImageList({images, onSelectImage, videoKachel = null}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFeatured, setModalFeatured] = useState(null);

  if (!images?.nodes?.length) return null;

  const allImages = images.nodes;
  const bildKacheln = videoKachel ? 3 : 4;
  const hasMore = allImages.length > bildKacheln;
  const thumbnails = hasMore ? allImages.slice(0, bildKacheln) : allImages;

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
            sizes={VORSCHAU_SIZES}
            srcSetOptions={VORSCHAU_SRCSET}
            className="thumb-image"
            loading={index === 0 ? 'eager' : 'lazy'}
          />
        ))}
        {videoKachel}
        {hasMore && (
          <button
            className="ImageSeeMore"
            onClick={() => openModal(allImages[bildKacheln])}
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
              <span>+{allImages.length - bildKacheln}</span>
            </div>
            <Image
              data={allImages[bildKacheln]}
              alt={allImages[bildKacheln].altText || ''}
              aspectRatio="1/1"
              sizes={VORSCHAU_SIZES}
              srcSetOptions={VORSCHAU_SRCSET}
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
