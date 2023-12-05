import juice from 'juice';
export const solveHtml = (html, style) => {
  html = `<div id="nice">${html}</div>`
  html = html.replace(/<mjx-container (class="inline.+?)<\/mjx-container>/g, "<span $1</span>");
  html = html.replace(/\s<span class="inline/g, '&nbsp;<span class="inline');
  html = html.replace(/svg><\/span>\s/g, "svg></span>&nbsp;");
  html = html.replace(/mjx-container/g, "section");
  html = html.replace(/class="mjx-solid"/g, 'fill="none" stroke-width="70"');
  html = html.replace(/<mjx-assistive-mml.+?<\/mjx-assistive-mml>/g, "");
  let res = "";
  try {
    res = juice.inlineContent(html, style, {
      inlinePseudoElements: true,
      preserveImportant: true,
    });
  } catch (e) {
    console.log('请检查 CSS 文件是否编写正确!')
  }

  return res;
}; 
