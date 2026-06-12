import { describe, expect, it } from 'vitest'
import { isProxy, reactive, ref, shallowReactive } from 'vue'

import { getRawData } from '../src/renderer/utils/common'

describe('getRawData 深度扩展工具测试', () => {
  it('应当能处理基本类型和 null', () => {
    expect(getRawData(42)).toBe(42)
    expect(getRawData('hello')).toBe('hello')
    expect(getRawData(true)).toBe(true)
    expect(getRawData(null)).toBeNull()
    expect(getRawData(undefined)).toBeUndefined()
  })

  it('应当能处理简单的 Ref 和 Reactive 对象', () => {
    const numRef = ref(100)
    const strReactive = reactive({ text: 'vue' })

    expect(getRawData(numRef)).toBe(100)
    const result = getRawData(strReactive)
    expect(result).toEqual({ text: 'vue' })
    expect(isProxy(result)).toBe(false)
  })

  it('应当能处理嵌套的数组和对象', () => {
    const nested = reactive({
      list: [ref(1), reactive({ val: 2 }), 3],
      info: {
        name: ref('test'),
        details: reactive({ age: 30 }),
      },
    })

    const result = getRawData(nested)

    expect(result).toEqual({
      list: [1, { val: 2 }, 3],
      info: {
        name: 'test',
        details: { age: 30 },
      },
    })
    expect(isProxy(result)).toBe(false)
    expect(isProxy(result.info)).toBe(false)
    expect(isProxy(result.list[1])).toBe(false)
  })

  it('应当能处理深层嵌套的 Map', () => {
    const map = reactive(new Map())
    const keyRef = ref('info')
    const valReactive = reactive({ id: 1, tags: ref(['vue', 'ts']) })

    map.set(keyRef, valReactive)

    const result = getRawData(map)

    expect(result).toBeInstanceOf(Map)
    expect(result.has('info')).toBe(true)
    const info = result.get('info')
    expect(info.id).toBe(1)
    expect(info.tags).toEqual(['vue', 'ts'])
    expect(isProxy(info)).toBe(false)
  })

  it('应当能处理深层嵌套的 Set', () => {
    const set = reactive(new Set())
    const item = reactive({ name: 'test' })
    set.add(item)
    set.add(ref(100))

    const result = getRawData(set)

    expect(result).toBeInstanceOf(Set)
    const items = Array.from(result)
    expect(items).toContainEqual({ name: 'test' })
    expect(items).toContain(100)
    expect(isProxy(items[0])).toBe(false)
  })

  it('应当处理混合嵌套结构 (Object + Array + Set)', () => {
    const complex = reactive({
      users: new Set([reactive({ id: 1, meta: ref('admin') }), { id: 2, meta: 'user' }]),
      config: [ref(true), { active: ref(false) }],
    })

    const result = getRawData(complex)

    expect(result.users).toBeInstanceOf(Set)
    const userArr = Array.from(result.users) as any[]
    expect(userArr[0].meta).toBe('admin')
    expect(result.config[0]).toBe(true)
    expect(result.config[1].active).toBe(false)
  })

  it('应当正确克隆 Date 和 RegExp', () => {
    const date = new Date('2024-01-02')
    const reg = /test/g
    const data = reactive({ date, reg })

    const result = getRawData(data)

    expect(result.date).toBeInstanceOf(Date)
    expect(result.date.getFullYear()).toBe(2024)
    expect(result.date).not.toBe(date)
    expect(result.reg).toBeInstanceOf(RegExp)
    expect(result.reg.test('test')).toBe(true)
  })

  it('应当处理 shallowReactive', () => {
    const shallow = shallowReactive({
      nested: { a: 1 },
    })
    const result = getRawData(shallow)
    expect(result.nested.a).toBe(1)
    expect(result).not.toBe(shallow)
  })
})
