import React, { useState } from "react";
import Art from "../lib/Art.jsx";
import { usePlacePhoto } from "../lib/photos.js";

// Photo priority: the event's own image -> a Wikipedia photo of its city -> generated artwork.
export default function EventImage({ e, className, children }) {
  const [ownFailed, setOwnFailed] = useState(false);
  const [wikiStage, setWikiStage] = useState(0); // 0 = large photo, 1 = small thumbnail, 2 = give up
  const wikiFailed = wikiStage >= 2;
  const useOwn = Boolean(e.image) && !ownFailed;
  const wiki = usePlacePhoto(e.city, !useOwn && !wikiFailed);
  let media;
  if (useOwn) media = <img src={e.image} alt="" loading="lazy" onError={() => setOwnFailed(true)} />;
  else if (wiki && !wikiFailed) media = (
    <>
      <img src={wikiStage === 0 ? wiki.url : wiki.fallback} alt={`${e.city}`} loading="lazy" onError={() => setWikiStage((n) => n + 1)} />
      <a className="photo-credit" href={wiki.page} target="_blank" rel="noreferrer" onClick={(ev) => ev.stopPropagation()}>Photo: Wikipedia</a>
    </>
  );
  else media = <Art kind={e.kind || "city"} id={e.id} />;
  return (
    <div className={className}>
      {media}
      {children}
    </div>
  );
}
