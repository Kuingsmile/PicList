// Image && PicBed
interface ImgInfo {
  buffer?: Buffer
  base64Image?: string
  fileName?: string
  width?: number
  height?: number
  extname?: string
  imgUrl?: string
  id?: string
  type?: string
  galleryTags?: string[]
  [propName: string]: any
}

interface IGalleryItem extends ImgInfo {
  galleryTags: string[]
  src: string
  key: string
  intro: string
}

interface IGalleryDBGalleryItem {
  id: string
  updatedAt?: number
  [propName: string]: any
}
