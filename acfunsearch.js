// ==UserScript==
// @name         Acfun_UP稿件搜索优化版
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  来点稿件搜索 - 优化版，图片缩小
// @author       幽想
// @match        https://www.acfun.cn/u/*
// @license      GNU GPLv3
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      member.acfun.cn
// @require      https://cdn.jsdelivr.net/npm/sweetalert2@11.0.18/dist/sweetalert2.all.min.js
// ==/UserScript==

(function() {
    'use strict';

    var searchPage = 0;

    // 初始化设置
    if (!GM_getValue('showSearchCount')) {
        GM_setValue('showSearchCount', 20);
    }
    if (!GM_getValue('searchDefType')) {
        GM_setValue('searchDefType', 0);
    }
    var searchDefType = GM_getValue('searchDefType');
    var count = GM_getValue('showSearchCount');

    // 添加CSS样式
    GM_addStyle(`
        #yx_search_main {
            flex-wrap: wrap;
            overflow: visible;
            justify-content: center;
        }

        .yx_search-video, .yx_search-article {
            padding: 0.75rem;
            display: flex;
            border-bottom: 1px solid #ececec;
            transition: all 0.3s ease-in-out;
            max-height: 90px;
            align-items: center;
            background-color: white;
            border-radius: 5px;
        }

        .yx_search-video:hover {
            transform: scale(1.01);
            background-color: lightgrey;
        }

        .yx_search-article {
            width: 47%;
        }

        .yx_search-article:hover {
            transform: scale(1.05);
            background-color: #f3f3f3;
            border: 2px solid #fd4c5d;
        }

        /* 图片容器样式 - 缩小图片 */
        .yx_svideo_cover {
            width: 100px;
            height: 56px;
            flex-shrink: 0;
            overflow: hidden;
            border-radius: 3px;
            margin-right: 10px;
        }

        .yx_svideo_cover img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }

        .yx_svideo_main {
            margin-left: 0;
            display: flex;
            flex: 1;
            flex-wrap: wrap;
        }

        .yx_svideo_main_title {
            font-size: 1.1rem;
            font-weight: bold;
            width: 100%;
            line-height: 1.2;
            margin-bottom: 5px;
        }

        .yx_svideo_main_info {
            font-size: 0.9rem;
            width: 100%;
            color: #666;
        }

        .yx_search_keyWord {
            padding-top: 0.5rem;
            height: 30px;
            display: flex;
            justify-content: flex-end;
        }

        .yx_search_keyWord_main {
            border: 1px solid #ccc;
            display: flex;
            width: fit-content;
            border-radius: 3px;
        }

        .yx_search_keyWord_main > input {
            outline-style: none;
            border: 0;
            padding: 0.3rem;
            border-right: 1px solid #ccc;
            width: 18rem;
            font-size: 14px;
        }

        .yx_search_keyWord_main > div {
            display: flex;
            align-items: center;
            cursor: pointer;
            padding: 0px 0.3rem;
            transition: all 0.3s ease-in-out;
            background: white;
            font-size: 14px;
        }

        .yx_search_keyWord_main > div:hover {
            background: #fd4c5b;
            color: white;
            transform: scale(1.1);
        }

        #yx_searchBtn_Video {
            border-right: 1px solid #ccc;
        }

        #yx_search_pager {
            margin-top: 0.7rem;
            display: flex;
            justify-content: center;
        }

        .yx_search_aComment {
            float: left;
            width: 80px;
            margin-top: -1px;
            text-align: center;
            font-size: 12px;
            line-height: 12px;
            color: #999;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        .yx_search_aComment_count {
            font-size: 16px;
            line-height: 16px;
            color: #fd4c5d;
            margin-bottom: 3px;
            font-weight: bold;
        }

        #yx_search_settings {
            border-right: 1px solid #ccc;
        }

        #yx_search_settings:hover svg {
            animation: 1s rotate180;
        }

        @keyframes rotate180 {
            from { transform: rotate(0deg); }
            to   { transform: rotate(180deg); }
        }

        /* 分页样式 */
        .pager__wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 10px 0;
        }

        .pager__btn {
            padding: 5px 15px;
            margin: 0 5px;
            border: 1px solid #ddd;
            border-radius: 3px;
            cursor: pointer;
            text-decoration: none;
            color: #333;
            background-color: #f5f5f5;
            transition: all 0.3s ease;
        }

        .pager__btn:hover {
            background-color: #fd4c5b;
            color: white;
            border-color: #fd4c5b;
        }

        .pager__btn__disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .pager__btn__disabled:hover {
            background-color: #f5f5f5;
            color: #333;
            border-color: #ddd;
        }

        .pager__ellipsis {
            margin: 0 10px;
        }

        .pager__input {
            margin-left: 15px;
            display: flex;
            align-items: center;
        }

        .pager__input input {
            width: 50px;
            margin: 0 5px;
            padding: 3px;
            border: 1px solid #ddd;
            border-radius: 3px;
            text-align: center;
        }
    `);

    // 工具函数
    function toast_info(t, timer = 2000) {
        Swal.fire({
            icon: 'info',
            title: t,
            showConfirmButton: false,
            toast: true,
            timer: timer,
            position: 'top-end'
        });
    }

    function toast_error(t, timer = 2000) {
        Swal.fire({
            icon: 'error',
            title: t,
            showConfirmButton: false,
            toast: true,
            timer: timer,
            position: 'top-end'
        });
    }

    function gensHTML_v(acid, coverUrl, title, infos) {
        // 确保图片尺寸为100x56
        let smallCoverUrl = coverUrl;
        if (smallCoverUrl.includes('?imageView2')) {
            // 替换已有的尺寸参数
            smallCoverUrl = smallCoverUrl.replace(/w=\d+/g, 'w=100').replace(/h=\d+/g, 'h=56');
        } else {
            // 添加尺寸参数
            smallCoverUrl += (smallCoverUrl.includes('?') ? '&' : '?') + 'imageView2/1/w/100/h/56';
        }

        const content = `
<div class="yx_search-video">
    <div class="yx_svideo_cover">
        <a href="/v/ac${acid}" target="_blank">
            <img src="${smallCoverUrl}" alt="${title}" onerror="this.src='//cdn.aixifan.com/static/css/images/blank.jpg'">
        </a>
    </div>
    <div class="yx_svideo_main">
        <div class="yx_svideo_main_title">
            <a href="/v/ac${acid}" target="_blank">${title}</a>
        </div>
        <div class="yx_svideo_main_info">
            <p>${infos}</p>
        </div>
    </div>
</div>`;
        return content;
    }

    function gensHTML_a(acid, commentCount, title, infos) {
        const content = `
<div class="yx_search-article">
    <div class="yx_svideo_cover">
        <a href="/a/ac${acid}" target="_blank">
            <div class="yx_search_aComment">
                <div class="yx_search_aComment_count">${commentCount}</div>
                <span>评论</span>
            </div>
        </a>
    </div>
    <div class="yx_svideo_main">
        <div class="yx_svideo_main_title">
            <a href="/a/ac${acid}" target="_blank">${title}</a>
        </div>
        <div class="yx_svideo_main_info">
            <p>${infos}</p>
        </div>
    </div>
</div>`;
        return content;
    }

    function updateNum(n) {
        let div = document.querySelector('#yx_search_TotalNum');
        if (!!div) {
            div.textContent = n;
        }
    }

    function addPager(np, tp, kw, rt) {
        if (tp <= 1) {
            return;
        }

        let e = document.createElement('div');
        let prev = '';
        let next = '';

        if (np === 0) {
            prev = 'pager__btn__disabled';
        }
        if (np === tp - 1) {
            next = 'pager__btn__disabled';
        }

        let content = `<div id="yx_search_pager" class="pager__wrapper">
            <a class="pager__btn pager__btn__prev ${prev}" id="yx_search_pager_prev">上一页</a>
            <span class="pager__ellipsis">${np + 1} / ${tp}</span>
            <a class="pager__btn pager__btn__next ${next}" id="yx_search_pager_next">下一页</a>
            <div class="pager__input">跳至<input type="text" id="yx_search_pager_input" maxlength="4">页</div>
        </div>`;

        append2Div(content);

        document.querySelector('#yx_search_pager_prev').addEventListener('click', function() {
            if (this.classList.contains('pager__btn__disabled')) {
                return;
            }
            search(kw, np - 1, rt);
        });

        document.querySelector('#yx_search_pager_next').addEventListener('click', function() {
            if (this.classList.contains('pager__btn__disabled')) {
                return;
            }
            search(kw, np + 1, rt);
        });

        document.querySelector('#yx_search_pager_input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                let page = Number(this.value) - 1;
                if (isNaN(page) || page < 0) {
                    toast_error('请输入有效页码');
                    return;
                }
                if (page + 1 > tp) {
                    toast_error('超出页数范围，最大页数为 ' + tp);
                    return;
                }
                search(kw, page, rt);
            }
        });
    }

    function append2Div(v) {
        let tdiv = document.querySelector('#yx_search_main');
        if (!tdiv) {
            toast_error('搜索结果面板异常，请刷新页面重试。');
            return;
        }
        let n = document.createElement('div');
        tdiv.appendChild(n);
        n.outerHTML = v;
    }

    function clearSearchPanel() {
        let panel = document.querySelector("#yx_search_main");
        if (panel) {
            panel.innerHTML = '';
        }
    }

    async function getKW(uid, keyword, page = 0, rtype = 2, stype = 3) {
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: 'https://member.acfun.cn/list/api/queryContributeList',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: `pcursor=${page}&count=${count}&resourceType=${rtype}&sortType=${stype}&authorId=${uid}&keyword=${keyword}`,
                onload: function(response) {
                    if (response.status === 200) {
                        try {
                            resolve(JSON.parse(response.responseText));
                        } catch (e) {
                            console.error('解析JSON失败:', e);
                            resolve(null);
                        }
                    } else {
                        console.error('请求失败，状态码:', response.status);
                        resolve(null);
                    }
                },
                onerror: function() {
                    console.error('网络请求失败');
                    resolve(null);
                }
            });
        });
    }

    async function search(keyword, page = 0, rtype = 2, append = false) {
        if (!append) {
            clearSearchPanel();
        }

        toast_info('正在获取数据…', 1000);

        let uid;
        try {
            uid = document.URL.match(/acfun\.cn\/u\/(\d+)/)[1];
        } catch (e) {
            toast_error('UID获取出错，请确认当前页面是UP主主页');
            console.error('UID获取出错:', e);
            return;
        }

        if (!uid) {
            toast_error('无法获取用户ID');
            return;
        }

        let j = await getKW(uid, encodeURIComponent(keyword), page, rtype);

        if (!j) {
            toast_error('网络请求失败，请检查网络连接');
            return;
        }

        if (j.result !== 0) {
            toast_error('API返回错误: ' + j.result);
            console.error('API错误:', j);
            return;
        }

        if (j.totalNum === 0) {
            toast_info('未找到相关稿件');
            updateNum(0);
            return;
        }

        updateNum(j.totalNum);
        let arr = j.feed || [];

        arr.forEach(function(v) {
            let content = '';

            if (rtype === 2) { // 视频
                // 确保使用正确的封面URL
                let coverUrl = v.coverUrl || v.cover || '';
                if (!coverUrl.includes('http')) {
                    coverUrl = 'https:' + coverUrl;
                }

                content = gensHTML_v(
                    v.dougaId || v.contentId,
                    coverUrl,
                    v.title || v.contentTitle,
                    `播放:${v.viewCountShow || 0} 评论:${v.commentCount || 0} 弹幕:${v.danmakuCount || 0} 时间:${v.createTime || ''}`
                );
            } else if (rtype === 3) { // 文章
                let otime = v.contributeTime || v.createTime;
                let ntime = getTime_Unix(otime);
                content = gensHTML_a(
                    v.contentId,
                    v.commentCount || 0,
                    v.contentTitle || v.title,
                    `浏览:${v.viewCountShow || 0} 时间:${ntime}`
                );
            }

            if (content) {
                append2Div(content);
            }
        });

        // 设置布局
        if (rtype === 2) {
            document.querySelector('#yx_search_main').style.display = '';
        } else if (rtype === 3) {
            document.querySelector('#yx_search_main').style.display = 'flex';
        }

        // 计算总页数
        let totalPages = Math.ceil(j.totalNum / count);
        if (totalPages > 1) {
            addPager(page, totalPages, keyword, rtype);
        }

        // 激活搜索结果标签
        let searchTab = document.querySelector("#yx_search_li");
        if (searchTab) {
            searchTab.click();
        }
    }

    function getTime_Unix(unix) {
        if (!unix) return '未知时间';

        unix = Number(unix);
        let le = unix.toString().length;
        if (le === 10) { // 10位unix时间戳则乘1000
            unix = unix * 1000;
        }

        let time = new Date(unix);
        return time.getFullYear() + '/' +
               String(time.getMonth() + 1).padStart(2, '0') + '/' +
               String(time.getDate()).padStart(2, '0');
    }

    function changeSearchDefType(v) {
        GM_setValue('searchDefType', v);
        searchDefType = v;
    }

    function showSettings() {
        Swal.fire({
            title: '稿件搜索栏设置',
            html: `
                <div style="border-bottom: 1px solid lightblue; padding-bottom: 1rem; display: flex; flex-wrap: wrap; justify-content: center;">
                    <p style="text-align: left; width: 100%; font-weight: bold; color: black; margin-bottom: 10px;">回车键默认搜索</p>
                    <div style="margin-right: 3rem; display: flex; align-items: center;">
                        <input type="radio" name="defSerchType" id="yx_search_settings_defVideo" style="margin-right: 5px;">
                        <label for="yx_search_settings_defVideo">视频</label>
                    </div>
                    <div style="display: flex; align-items: center;">
                        <input type="radio" name="defSerchType" id="yx_search_settings_defArticle" style="margin-right: 5px;">
                        <label for="yx_search_settings_defArticle">文章</label>
                    </div>
                </div>
                <div style="border-bottom: 1px solid lightblue; padding: 1rem 0; display: flex; flex-wrap: wrap; justify-content: center;">
                    <p style="text-align: left; width: 100%; font-weight: bold; color: black; margin-bottom: 10px;">检索结果每页显示数量</p>
                    <div style="text-align: center;">
                        <input class="swal2-input" style="width: 7rem; text-align: center; margin-bottom: 5px;" type="text" maxlength="2" id="yx_search_settings_showCountForSPage" placeholder="输入1-99">
                        <p style="margin: 0; font-size: 12px; color: #666;">(1-99)</p>
                    </div>
                </div>
                <p style="width: 100%; margin-top: 1rem; color: black; font-size: 12px; text-align: center;">设置将实时保存</p>
            `,
            allowEscapeKey: true,
            allowEnterKey: false,
            allowOutsideClick: true,
            showConfirmButton: false,
            showCloseButton: true,
            didOpen: function() {
                // 导入默认配置
                if (GM_getValue('searchDefType') == 1) {
                    document.querySelector("#yx_search_settings_defArticle").checked = true;
                } else {
                    document.querySelector("#yx_search_settings_defVideo").checked = true;
                }

                document.querySelector("#yx_search_settings_showCountForSPage").value = count;

                // 实现按钮效果
                document.querySelector("#yx_search_settings_defVideo").addEventListener('click', function() {
                    changeSearchDefType(0);
                });

                document.querySelector("#yx_search_settings_defArticle").addEventListener('click', function() {
                    changeSearchDefType(1);
                });

                document.querySelector("#yx_search_settings_showCountForSPage").addEventListener('input', function() {
                    let text = this.value;
                    text = text.replace(/[^\d]/g, '');

                    let num = Number(text);
                    if (isNaN(num) || num < 1) {
                        num = 1;
                    } else if (num > 99) {
                        num = 99;
                    }

                    this.value = num;
                    count = num;
                    GM_setValue('showSearchCount', num);
                });
            }
        });
    }

    function init() {
        // 检查是否已在UP主主页
        if (!document.URL.includes('acfun.cn/u/')) {
            return;
        }

        // 等待页面加载完成
        let checkExist = setInterval(function() {
            let tagsDiv = document.querySelector("ul.tags");
            let contentDiv = document.querySelector("div.ac-space-contribute-list");

            if (tagsDiv && contentDiv) {
                clearInterval(checkExist);

                // 添加搜索结果标签
                let n = document.createElement('li');
                n.setAttribute('data-index', 'yx_search');
                n.setAttribute('id', 'yx_search_li');
                n.setAttribute('data-count', '0');
                n.innerHTML = '搜索结果<span id="yx_search_TotalNum">0</span>';
                tagsDiv.insertBefore(n, tagsDiv.lastElementChild);

                // 添加搜索结果内容区域
                let n1 = document.createElement('div');
                n1.setAttribute('data-index', 'yx_search');
                n1.setAttribute('id', 'yx_search_main');
                n1.setAttribute('class', 'tag-content');
                n1.style.display = 'none';
                contentDiv.appendChild(n1);

                // 添加搜索框
                let contributeDiv;
                document.querySelectorAll("#ac-space > div.wp > div.tab-content").forEach(function(v) {
                    if (v.getAttribute('tab-index') == 'contribute') {
                        contributeDiv = v;
                    }
                });

                if (contributeDiv) {
                    let n2 = document.createElement('div');
                    n2.innerHTML = `
<div class="yx_search_keyWord">
    <div class="yx_search_keyWord_main">
        <div id="yx_search_settings" title="设置">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"></path>
                <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"></path>
            </svg>
        </div>
        <input id="yx_search_keyWordInput" autocomplete="off" placeholder="搜索稿件...">
        <div id="yx_searchBtn_Video">搜索视频</div>
        <div id="yx_searchBtn_Article">搜索文章</div>
    </div>
</div>`;
                    contributeDiv.insertBefore(n2, contributeDiv.firstChild);

                    // 绑定事件
                    document.querySelector("#yx_search_keyWordInput").addEventListener('keypress', function(e) {
                        if (e.key === 'Enter') {
                            if (searchDefType == 0) { // 检索视频
                                search(this.value.trim());
                            } else { // 检索文章
                                search(this.value.trim(), 0, 3);
                            }
                        }
                    });

                    document.querySelector("#yx_searchBtn_Video").addEventListener('click', function() {
                        let keyword = document.querySelector("#yx_search_keyWordInput").value.trim();
                        if (keyword) {
                            search(keyword);
                        } else {
                            toast_error('请输入搜索关键词');
                        }
                    });

                    document.querySelector("#yx_searchBtn_Article").addEventListener('click', function() {
                        let keyword = document.querySelector("#yx_search_keyWordInput").value.trim();
                        if (keyword) {
                            search(keyword, 0, 3);
                        } else {
                            toast_error('请输入搜索关键词');
                        }
                    });

                    document.querySelector("#yx_search_settings").addEventListener('click', showSettings);

                    // 标签切换事件
                    document.querySelector("#yx_search_li").addEventListener('click', function() {
                        // 隐藏其他标签内容
                        document.querySelectorAll(".tag-content").forEach(el => {
                            el.style.display = 'none';
                        });

                        // 显示搜索内容
                        document.querySelector("#yx_search_main").style.display = '';

                        // 更新标签状态
                        document.querySelectorAll("ul.tags li").forEach(el => {
                            el.classList.remove('active');
                        });
                        this.classList.add('active');
                    });

                    // 初始隐藏搜索面板
                    document.querySelector("#yx_search_main").style.display = 'none';
                }

                console.log('Acfun UP稿件搜索脚本初始化完成');
            }
        }, 500);
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 1000); // 延迟1秒确保页面完全加载
    }

})();
