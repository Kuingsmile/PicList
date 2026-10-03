<template>
  <div
    class="overflow-y-auto bg-bg-tertiary p-5 text-base leading-[1.5] text-secondary [&_a]:text-accent [&_a]:underline [&_a:hover]:text-accent-hover [&_h1]:mt-5 [&_h1]:mb-2 [&_h1]:font-bold [&_h1]:text-main [&_h1:first-child]:mt-0 [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:font-bold [&_h2]:text-main [&_h2:first-child]:mt-0 [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:font-bold [&_h3]:text-main [&_h3:first-child]:mt-0 [&_img]:max-w-full [&_img]:rounded-md [&_li]:mb-1.5 [&_ol]:my-3.5 [&_ol]:list-inside [&_ol]:pl-6 [&_p]:mb-2 [&_ul]:my-3.5 [&_ul]:list-inside [&_ul]:pl-6"
    v-html="html"
  />
</template>

<script setup lang="ts">
// Callers pass HTML sanitized by renderMarkdown from @/utils/markdown.
defineProps<{ html: string }>()
</script>
