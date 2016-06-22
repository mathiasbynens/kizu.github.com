!function(){var e=/\blang(?:uage)?-(?!\*)(\w+)\b/i,t=self.Prism={util:{type:function(e){return Object.prototype.toString.call(e).match(/\[object (\w+)\]/)[1]},clone:function(e){var a=t.util.type(e);switch(a){case"Object":var n={};for(var r in e)e.hasOwnProperty(r)&&(n[r]=t.util.clone(e[r]));return n;case"Array":return e.slice()}return e}},languages:{extend:function(e,a){var n=t.util.clone(t.languages[e]);for(var r in a)n[r]=a[r];return n},insertBefore:function(e,a,n,r){r=r||t.languages;var s=r[e],i={};for(var l in s)if(s.hasOwnProperty(l)){if(l==a)for(var g in n)n.hasOwnProperty(g)&&(i[g]=n[g]);i[l]=s[l]}return r[e]=i},DFS:function(e,a){for(var n in e)a.call(e,n,e[n]),"Object"===t.util.type(e)&&t.languages.DFS(e[n],a)}},highlightAll:function(e,a){for(var n,r=document.querySelectorAll('code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'),s=0;n=r[s++];)t.highlightElement(n,e===!0,a)},highlightElement:function(n,r,s){for(var i,l,g=n;g&&!e.test(g.className);)g=g.parentNode;if(g&&(i=(g.className.match(e)||[,""])[1],l=t.languages[i]),l){n.className=n.className.replace(e,"").replace(/\s+/g," ")+" language-"+i,g=n.parentNode,/pre/i.test(g.nodeName)&&(g.className=g.className.replace(e,"").replace(/\s+/g," ")+" language-"+i);var o=n.textContent;if(o){o=o.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/\u00a0/g," ");var c={element:n,language:i,grammar:l,code:o};if(t.hooks.run("before-highlight",c),r&&self.Worker){var u=new Worker(t.filename);u.onmessage=function(e){c.highlightedCode=a.stringify(JSON.parse(e.data),i),t.hooks.run("before-insert",c),c.element.innerHTML=c.highlightedCode,s&&s.call(c.element),t.hooks.run("after-highlight",c)},u.postMessage(JSON.stringify({language:c.language,code:c.code}))}else c.highlightedCode=t.highlight(c.code,c.grammar,c.language),t.hooks.run("before-insert",c),c.element.innerHTML=c.highlightedCode,s&&s.call(n),t.hooks.run("after-highlight",c)}}},highlight:function(e,n,r){return a.stringify(t.tokenize(e,n),r)},tokenize:function(e,a,n){var r=t.Token,s=[e],i=a.rest;if(i){for(var l in i)a[l]=i[l];delete a.rest}e:for(var l in a)if(a.hasOwnProperty(l)&&a[l]){var g=a[l],o=g.inside,c=!!g.lookbehind,u=0;g=g.pattern||g;for(var p=0;p<s.length;p++){var m=s[p];if(s.length>e.length)break e;if(!(m instanceof r)){g.lastIndex=0;var f=g.exec(m);if(f){c&&(u=f[1].length);var d=f.index-1+u,f=f[0].slice(u),h=f.length,y=d+h,w=m.slice(0,d+1),b=m.slice(y+1),k=[p,1];w&&k.push(w);var v=new r(l,o?t.tokenize(f,o):f);k.push(v),b&&k.push(b),Array.prototype.splice.apply(s,k)}}}}return s},hooks:{all:{},add:function(e,a){var n=t.hooks.all;n[e]=n[e]||[],n[e].push(a)},run:function(e,a){var n=t.hooks.all[e];if(n&&n.length)for(var r,s=0;r=n[s++];)r(a)}}},a=t.Token=function(e,t){this.type=e,this.content=t};if(a.stringify=function(e,n,r){if("string"==typeof e)return e;if("[object Array]"==Object.prototype.toString.call(e))return e.map(function(t){return a.stringify(t,n,e)}).join("");var s={type:e.type,content:a.stringify(e.content,n,r),tag:"span",classes:["token",e.type],attributes:{},language:n,parent:r};"comment"==s.type&&(s.attributes.spellcheck="true"),t.hooks.run("wrap",s);var i="";for(var l in s.attributes)i+=l+'="'+(s.attributes[l]||"")+'"';return"<"+s.tag+' class="'+s.classes.join(" ")+'" '+i+">"+s.content+"</"+s.tag+">"},!self.document)return void self.addEventListener("message",function(e){var a=JSON.parse(e.data),n=a.language,r=a.code;self.postMessage(JSON.stringify(t.tokenize(r,t.languages[n]))),self.close()},!1);var n=document.getElementsByTagName("script");n=n[n.length-1],n&&(t.filename=n.src,document.addEventListener&&!n.hasAttribute("data-manual")&&document.addEventListener("DOMContentLoaded",t.highlightAll))}(),Prism.languages.markup={comment:/&lt;!--[\w\W]*?-->/g,prolog:/&lt;\?.+?\?>/,doctype:/&lt;!DOCTYPE.+?>/,cdata:/&lt;!\[CDATA\[[\w\W]*?]]>/i,tag:{pattern:/&lt;\/?[\w:-]+\s*(?:\s+[\w:-]+(?:=(?:("|')(\\?[\w\W])*?\1|\w+))?\s*)*\/?>/gi,inside:{tag:{pattern:/^&lt;\/?[\w:-]+/i,inside:{punctuation:/^&lt;\/?/,namespace:/^[\w-]+?:/}},"attr-value":{pattern:/=(?:('|")[\w\W]*?(\1)|[^\s>]+)/gi,inside:{punctuation:/=|>|"/g}},punctuation:/\/?>/g,"attr-name":{pattern:/[\w:-]+/g,inside:{namespace:/^[\w-]+?:/}}}},entity:/&amp;#?[\da-z]{1,8};/gi},Prism.hooks.add("wrap",function(e){"entity"===e.type&&(e.attributes.title=e.content.replace(/&amp;/,"&"))}),Prism.languages.css={comment:/\/\*[\w\W]*?\*\//g,atrule:{pattern:/@[\w-]+?.*?(;|(?=\s*{))/gi,inside:{punctuation:/[;:]/g}},url:/url\((["']?).*?\1\)/gi,selector:/[^\{\}\s][^\{\};]*(?=\s*\{)/g,property:/(\b|\B)[\w-]+(?=\s*:)/gi,string:/("|')(\\?.)*?\1/g,important:/\B!important\b/gi,ignore:/&(lt|gt|amp);/gi,punctuation:/[\{\};:]/g},Prism.languages.markup&&Prism.languages.insertBefore("markup","tag",{style:{pattern:/(&lt;|<)style[\w\W]*?(>|&gt;)[\w\W]*?(&lt;|<)\/style(>|&gt;)/gi,inside:{tag:{pattern:/(&lt;|<)style[\w\W]*?(>|&gt;)|(&lt;|<)\/style(>|&gt;)/gi,inside:Prism.languages.markup.tag.inside},rest:Prism.languages.css}}}),Prism.languages.css.selector={pattern:/[^\{\}\s][^\{\}]*(?=\s*\{)/g,inside:{"pseudo-element":/:(?:after|before|first-letter|first-line|selection)|::[-\w]+/g,"pseudo-class":/:[-\w]+(?:\(.*\))?/g,"class":/\.[-:\.\w]+/g,id:/#[-:\.\w]+/g}},Prism.languages.insertBefore("css","ignore",{hexcode:/#[\da-f]{3,6}/gi,entity:/\\[\da-f]{1,8}/gi,number:/[\d%\.]+/g,"function":/(attr|calc|cross-fade|cycle|element|hsla?|image|lang|linear-gradient|matrix3d|matrix|perspective|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|rgba?|rotatex|rotatey|rotatez|rotate3d|rotate|scalex|scaley|scalez|scale3d|scale|skewx|skewy|skew|steps|translatex|translatey|translatez|translate3d|translate|url|var)/gi}),Prism.languages.scss=Prism.languages.extend("css",{comment:{pattern:/(^|[^\\])(\/\*[\w\W]*?\*\/|\/\/.*?(\r?\n|$))/g,lookbehind:!0},atrule:/@[\w-]+(?=\s+(\(|\{|;))/gi,url:/([-a-z]+-)*url(?=\()/gi,selector:/([^@;\{\}\(\)]?([^@;\{\}\(\)]|&amp;|\#\{\$[-_\w]+\})+)(?=\s*\{(\}|\s|[^\}]+(:|\{)[^\}]+))/gm}),Prism.languages.insertBefore("scss","atrule",{keyword:/@(if|else if|else|for|each|while|import|extend|debug|warn|mixin|include|function|return)|(?=@for\s+\$[-_\w]+\s)+from/i}),Prism.languages.insertBefore("scss","property",{variable:/((\$[-_\w]+)|(#\{\$[-_\w]+\}))/i}),Prism.languages.insertBefore("scss","ignore",{placeholder:/%[-_\w]+/i,statement:/\B!(default|optional)\b/gi,"boolean":/\b(true|false)\b/g,"null":/\b(null)\b/g,operator:/\s+([-+]{1,2}|={1,2}|!=|\|?\||\?|\*|\/|\%)\s+/g}),Prism.languages.clike={comment:{pattern:/(^|[^\\])(\/\*[\w\W]*?\*\/|[^:]\/\/.*?(\r?\n|$))/g,lookbehind:!0},string:/("|')(\\?.)*?\1/g,keyword:/\b(if|else|while|do|for|return|in|instanceof|function|new|try|catch|finally|null|break|continue)\b/g,"boolean":/\b(true|false)\b/g,number:/\b-?(0x)?\d*\.?[\da-f]+\b/g,operator:/[-+]{1,2}|!|=?&lt;|=?&gt;|={1,2}|(&amp;){1,2}|\|?\||\?|\*|\//g,ignore:/&(lt|gt|amp);/gi,punctuation:/[{}[\];(),.:]/g},Prism.languages.javascript=Prism.languages.extend("clike",{keyword:/\b(var|let|if|else|while|do|for|return|in|instanceof|function|new|with|typeof|try|catch|finally|null|break|continue)\b/g,number:/\b(-?(0x)?\d*\.?[\da-f]+|NaN|-?Infinity)\b/g}),Prism.languages.insertBefore("javascript","keyword",{regex:{pattern:/(^|[^\/])\/(?!\/)(\[.+?]|\\.|[^\/\r\n])+\/[gim]{0,3}(?=\s*($|[\r\n,.;})]))/g,lookbehind:!0}}),Prism.languages.markup&&Prism.languages.insertBefore("markup","tag",{script:{pattern:/(&lt;|<)script[\w\W]*?(>|&gt;)[\w\W]*?(&lt;|<)\/script(>|&gt;)/gi,inside:{tag:{pattern:/(&lt;|<)script[\w\W]*?(>|&gt;)|(&lt;|<)\/script(>|&gt;)/gi,inside:Prism.languages.markup.tag.inside},rest:Prism.languages.javascript}}}),Prism.languages.yaml={comment:{pattern:/(^|\s)(#.*?)(?=\r?\n|$)/g,lookbehind:!0},punctuation:{pattern:/(^|\s)(---)(?=[\s\n]|$)|[:]/g,lookbehind:!0}},Prism.languages.styl=Prism.languages.scss,Prism.languages.html=Prism.languages.markup,Prism.languages.js=Prism.languages.javascript;