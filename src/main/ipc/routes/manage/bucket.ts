import { IRPCActionType, IRPCType } from '~/constants'
import { ManageApi } from '~/manage/manageApi'

export default [
  {
    action: IRPCActionType.MANAGE_GET_BUCKET_LIST,
    handler: async (_: IIPCEvent, args: [currentPicBed: string, param: IStringKeyMap]) => {
      return new ManageApi(args[0]).getBucketList(args[1])
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.MANAGE_GET_BUCKET_LIST_BACKSTAGE,
    handler: async (_: IIPCEvent, args: [currentPicBed: string, param: IStringKeyMap]) => {
      return new ManageApi(args[0]).getBucketListBackstage(args[1])
    },
  },
  {
    action: IRPCActionType.MANAGE_GET_BUCKET_LIST_RECURSIVELY,
    handler: async (_: IIPCEvent, args: [currentPicBed: string, param: IStringKeyMap]) => {
      return new ManageApi(args[0]).getBucketListRecursively(args[1])
    },
  },
  {
    action: IRPCActionType.MANAGE_CREATE_BUCKET,
    handler: async (_: IIPCEvent, args: [currentPicBed: string, param: IStringKeyMap]) => {
      return new ManageApi(args[0]).createBucket(args[1])
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.MANAGE_GET_BUCKET_FILE_LIST,
    handler: async (_: IIPCEvent, args: [currentPicBed: string, param: IStringKeyMap]) => {
      return new ManageApi(args[0]).getBucketFileList(args[1])
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.MANAGE_GET_BUCKET_DOMAIN,
    handler: async (_: IIPCEvent, args: [currentPicBed: string, param: IStringKeyMap]) => {
      return new ManageApi(args[0]).getBucketDomain(args[1])
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.MANAGE_DELETE_BUCKET_ITEMS,
    handler: async (_: IIPCEvent, args: [currentPicBed: string, param: IStringKeyMap]) => {
      return new ManageApi(args[0]).deleteBucketItems(args[1])
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.MANAGE_GET_PRE_SIGNED_URL,
    handler: async (_: IIPCEvent, args: [currentPicBed: string, param: IStringKeyMap]) => {
      return new ManageApi(args[0]).getPreSignedUrl(args[1])
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.MANAGE_GET_FILE_PREVIEW,
    handler: async (_: IIPCEvent, args: [currentPicBed: string, param: { key: string }]) => {
      return new ManageApi(args[0]).getFilePreview(args[1])
    },
    type: IRPCType.INVOKE,
  },
  {
    action: IRPCActionType.MANAGE_UPLOAD_BUCKET_FILE,
    handler: async (_: IIPCEvent, args: [currentPicBed: string, param: IStringKeyMap]) => {
      return new ManageApi(args[0]).uploadBucketFile(args[1])
    },
  },
  {
    action: IRPCActionType.MANAGE_DOWNLOAD_BUCKET_FILE,
    handler: async (_: IIPCEvent, args: [currentPicBed: string, param: IStringKeyMap]) => {
      return new ManageApi(args[0]).downloadBucketFile(args[1])
    },
  },
  {
    action: IRPCActionType.MANAGE_CREATE_BUCKET_FOLDER,
    handler: async (_: IIPCEvent, args: [currentPicBed: string, param: IStringKeyMap]) => {
      return new ManageApi(args[0]).createBucketFolder(args[1])
    },
    type: IRPCType.INVOKE,
  },
]
