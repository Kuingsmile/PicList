<template>
  <webview
    src="https://piclist.cn/app.html"
    disablewebsecurity
    allowpopups
    autosize="on"
    scrollbars="none"
    style="width: 100%; height: 100%;"
  />
</template>

<script lang="ts">
export default {
  name: 'DocumentPage'
}
</script>
