/** Normalize once at the IPC boundary; filters and sorting share these immutable records. */
export function prepareGalleryItems(items: ImgInfo[]): IGalleryItem[] {
  return items.map((item, index) => ({
    ...item,
    src: item.galleryPath || item.imgUrl || '',
    key: item.id || `item-${index}`,
    intro: item.fileName || '',
  }))
}
