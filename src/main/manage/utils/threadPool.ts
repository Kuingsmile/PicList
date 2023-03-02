import { Worker, WorkerOptions } from 'worker_threads'

interface Task {
  data: any
  workerOptions: WorkerOptions | undefined
  resolve: (result: any) => void
  reject: (error: any) => void
}

class ThreadPool {
  private size: number
  private workerPath: string
  private availablePool: Worker[]
  private taskQueue: Task[]
  private busyPool: Worker[]
  private callBackList: any[]

  constructor (size: number, workerPath: string) {
    this.size = size
    this.workerPath = workerPath
    this.availablePool = []
    this.busyPool = []
    for (let i = 0; i < this.size; i++) {
      this.availablePool.push(new Worker(this.workerPath))
    }
    this.taskQueue = []
    this.callBackList = []
    this.init()
  }

  private init () {
    for (const worker of this.availablePool) {
      worker.on('message', (result) => {
        const { data } = result
        this.callBackList.shift()(data)
        this.busyPool = this.busyPool.filter((w) => w.threadId !== worker.threadId)
        this.availablePool.push(worker)
        this.processQueue()
      })
    }
  }

  private processQueue () {
    if (this.taskQueue.length === 0) return
    if (this.availablePool.length === 0) return
    const task = this.taskQueue.shift()
    const worker = this.availablePool.pop()
    if (worker && task) {
      this.callBackList.push(task.resolve)
      this.busyPool.push(worker)
      worker.postMessage(task.data)
    }
  }

  public async addTask (data: any, workerOptions?: WorkerOptions): Promise<any> {
    return new Promise((resolve, reject) => {
      this.taskQueue.push({ data, workerOptions, resolve, reject })
      this.processQueue()
    })
  }

  public async destroy (): Promise<void> {
    const terminatePromises = this.availablePool.map((worker) => new Promise((resolve) => {
      worker.terminate()
      worker.on('exit', () => {
        resolve(true)
      })
    }))
    await Promise.all(terminatePromises)
    this.availablePool = []
    this.taskQueue = []
  }
}

export default ThreadPool
