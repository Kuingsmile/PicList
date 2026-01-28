<template>
  <div ref="editorRef" class="h-full w-full overflow-hidden rounded-[4px]"></div>
</template>

<script setup>
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { css } from '@codemirror/lang-css'
import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { openSearchPanel, search, searchKeymap } from '@codemirror/search'
import { EditorState } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView, keymap, lineNumbers } from '@codemirror/view'
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  language: { type: String, default: 'javascript' },
  readOnly: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])
const editorRef = ref(null)
const view = shallowRef(null)

onMounted(() => {
  const languageExtension = props.language === 'json' ? json() : props.language === 'css' ? css() : javascript()
  const startState = EditorState.create({
    doc: props.modelValue,
    extensions: [
      lineNumbers(),
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      languageExtension,
      oneDark,
      search({ top: true }),
      keymap.of([...searchKeymap]),
      EditorView.lineWrapping,
      EditorView.editable.of(!props.readOnly),
      EditorView.updateListener.of(update => {
        if (update.docChanged) {
          emit('update:modelValue', update.state.doc.toString())
        }
      }),
    ],
  })

  view.value = new EditorView({
    state: startState,
    parent: editorRef.value,
  })
})

watch(
  () => props.modelValue,
  newVal => {
    const currVal = view.value?.state.doc.toString()
    if (view.value && newVal !== currVal) {
      view.value.dispatch({
        changes: { from: 0, to: currVal.length, insert: newVal },
      })
    }
  },
)

onMounted(() => {
  openSearchPanel(view.value)
})

onBeforeUnmount(() => {
  view.value?.destroy()
})
</script>

<style scoped>
@import 'tailwindcss' reference;
@import '../assets/css/theme.css' reference;
@import '../assets/css/utilities.css' reference;

:deep(.cm-editor) {
  @apply h-full;
}

:deep(.cm-scroller) {
  @apply font-['Fira_Code','SF_Mono',Monaco,Menlo,'Ubuntu_Mono',monospace];
}

:deep(.cm-search) {
  @apply border-b border-b-[#181a1f] bg-[#282c34] p-2! text-[#abb2bf];
}

:deep(.cm-search input) {
  @apply mr-2 rounded-md border border-[#181a1f] bg-[#21252b] px-2 py-1 text-white;
}

:deep(.cm-search button) {
  @apply cursor-pointer rounded-md border-none bg-[#3e4451] font-medium text-[#ecefe4];
}

:deep(.cm-search button:hover) {
  @apply bg-[#4b5263];
}
</style>
