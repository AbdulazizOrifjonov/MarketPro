import { useEffect, useRef, useState } from 'react';
import { MapPin, LocateFixed, Loader2 } from 'lucide-react';

const YANDEX_API_KEY = import.meta.env.VITE_YANDEX_MAPS_API_KEY;
const TASHKENT_CENTER = [41.311081, 69.240562];

function parseAddressComponents(geoObject) {
  const components = geoObject.properties.get('metaDataProperty.GeocoderMetaData.Address.Components') || [];
  const byKind = Object.fromEntries(components.map((c) => [c.kind, c.name]));
  return {
    region: byKind.province || '',
    district: byKind.area || byKind.locality || '',
    street: [byKind.street, byKind.house].filter(Boolean).join(' '),
  };
}

export function YandexMapPicker({ lat, lng, onChange, onAddressDetected }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const placemarkRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const onAddressDetectedRef = useRef(onAddressDetected);
  const [isReady, setIsReady] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locateError, setLocateError] = useState('');

  onChangeRef.current = onChange;
  onAddressDetectedRef.current = onAddressDetected;

  function setPin(map, coords) {
    if (placemarkRef.current) map.geoObjects.remove(placemarkRef.current);
    placemarkRef.current = new window.ymaps.Placemark(coords, {}, { preset: 'islands#redDotIcon' });
    map.geoObjects.add(placemarkRef.current);
  }

  function reverseGeocode(coords) {
    window.ymaps.geocode(coords).then((res) => {
      const geoObject = res.geoObjects.get(0);
      if (geoObject) onAddressDetectedRef.current?.(parseAddressComponents(geoObject));
    });
  }

  function handleLocateMe() {
    if (!navigator.geolocation) {
      setLocateError("Brauzeringiz joylashuvni aniqlashni qo'llamaydi");
      return;
    }
    setLocateError('');
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        const map = mapInstanceRef.current;
        if (map) {
          map.setCenter(coords, 16);
          setPin(map, coords);
          reverseGeocode(coords);
        }
        onChangeRef.current(coords[0], coords[1]);
        setIsLocating(false);
      },
      () => {
        setLocateError("Joylashuvga ruxsat berilmadi. Brauzer sozlamalaridan ruxsat bering yoki xaritadan qo'lda belgilang.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  useEffect(() => {
    if (!YANDEX_API_KEY) return;

    function init() {
      if (!window.ymaps || !mapRef.current || mapInstanceRef.current) return;
      window.ymaps.ready(() => {
        const center = lat && lng ? [lat, lng] : TASHKENT_CENTER;
        const map = new window.ymaps.Map(mapRef.current, { center, zoom: 12, controls: ['zoomControl'] });
        mapInstanceRef.current = map;

        if (lat && lng) setPin(map, center);

        map.events.add('click', (e) => {
          const coords = e.get('coords');
          setPin(map, coords);
          reverseGeocode(coords);
          onChangeRef.current(coords[0], coords[1]);
        });

        setIsReady(true);
      });
    }

    if (window.ymaps) {
      init();
      return;
    }
    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${YANDEX_API_KEY}&lang=uz_UZ`;
    script.async = true;
    script.onload = init;
    document.body.appendChild(script);

    return () => {
      mapInstanceRef.current?.destroy?.();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!YANDEX_API_KEY) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
        <MapPin className="h-6 w-6 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Xarita hali sozlanmagan (Yandex Maps API kaliti kerak). Manzilni yuqoridagi maydonlarga qo'lda kiriting.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {isReady ? "Manzilni aniqlashtirish uchun xaritada bosing" : 'Xarita yuklanmoqda...'}
        </p>
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={!isReady || isLocating}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-input px-2.5 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50"
        >
          {isLocating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />}
          Joylashuvimni aniqlash
        </button>
      </div>
      <div ref={mapRef} className="h-64 w-full overflow-hidden rounded-xl border border-border" />
      {locateError && <p className="mt-1.5 text-xs text-destructive">{locateError}</p>}
    </div>
  );
}
