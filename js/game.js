/* ============================================================
   Play Mode — テキスト隠しモード
   指定テキストの上に黒いブロックを配置し、
   クリックで四方に散らして掃除しながらページを閲覧する
   ============================================================ */

(function () {
    'use strict';

    /* ==========================================================
       設定
       ========================================================== */
    const BLOCK_AREA_RATIO = 0.80;   // 文字面積の80%
    const BLOCKS_PER_CHAR = 3;       // 1文字あたりのブロック数
    const SCATTER_DISTANCE = 300;    // 散る距離(px)
    const SCATTER_DURATION = 600;    // 散るアニメーション時間(ms)
    const FADE_DELAY = 400;          // フェードアウト開始ディレイ(ms)

    let isPlayMode = false;
    let blockGroups = [];            // 生成したブロック群を追跡

    /* ==========================================================
       ブロック生成 — インラインspan対応
       ========================================================== */

    /**
     * data-play-hide を持つ span/要素にブロックを重ねる。
     * 要素はインライン(span)でもブロック(h4等)でもOK。
     * 要素内の各文字の位置を取得し、ブロックを生成する。
     */
    function createBlocksForTarget(targetEl) {
        const text = targetEl.textContent;
        if (!text.trim()) return;

        // 位置計算の基準となる親要素(position: relativeを設定する先)を特定
        const isInline = window.getComputedStyle(targetEl).display === 'inline'
            || window.getComputedStyle(targetEl).display === 'inline-block';
        const positionParent = isInline ? findBlockParent(targetEl) : targetEl;

        // positionParentに position:relative を設定（まだなければ）
        const originalParentPosition = positionParent.style.position;
        if (!originalParentPosition || originalParentPosition === 'static') {
            positionParent.style.position = 'relative';
        }

        // 対象spanの位置を取得（文字分割前に元のspanの位置を記録）
        const parentRect = positionParent.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();

        // 位置計算用: テキストを一時的にspanに分割
        const originalHTML = targetEl.innerHTML;
        const chars = text.split('');

        targetEl.innerHTML = '';
        const charSpans = [];
        for (let i = 0; i < chars.length; i++) {
            const span = document.createElement('span');
            span.textContent = chars[i];
            targetEl.appendChild(span);
            charSpans.push(span);
        }

        // 対象spanの全文字のバウンディングボックスを計算
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        const charPositions = [];

        charSpans.forEach((span, idx) => {
            const ch = chars[idx];
            if (ch.trim() === '') return;

            const rect = span.getBoundingClientRect();
            const charX = rect.left - parentRect.left;
            const charY = rect.top - parentRect.top;
            const charW = rect.width;
            const charH = rect.height;

            if (charW === 0 || charH === 0) return;

            minX = Math.min(minX, charX);
            minY = Math.min(minY, charY);
            maxX = Math.max(maxX, charX + charW);
            maxY = Math.max(maxY, charY + charH);

            charPositions.push({ charX, charY, charW, charH });
        });

        // テキストを元に戻す
        targetEl.innerHTML = originalHTML;

        if (charPositions.length === 0) return;

        // コンテナを対象spanの領域だけに限定配置（少しパディング）
        const pad = 4;
        const containerX = minX - pad;
        const containerY = minY - pad;
        const containerW = (maxX - minX) + pad * 2;
        const containerH = (maxY - minY) + pad * 2;

        const container = document.createElement('div');
        container.className = 'play-hide-container';
        container.style.left = containerX + 'px';
        container.style.top = containerY + 'px';
        container.style.width = containerW + 'px';
        container.style.height = containerH + 'px';

        // ブロック生成（コンテナ内の相対座標で配置）
        const blocks = [];
        charPositions.forEach(({ charX, charY, charW, charH }) => {
            const totalBlockArea = charW * charH * BLOCK_AREA_RATIO;
            const areaPerBlock = totalBlockArea / BLOCKS_PER_CHAR;

            for (let b = 0; b < BLOCKS_PER_CHAR; b++) {
                const aspectRatio = 0.5 + Math.random() * 1.5;
                const blockW = Math.sqrt(areaPerBlock * aspectRatio);
                const blockH = areaPerBlock / blockW;

                // コンテナ内の相対座標に変換
                const offsetX = (charX - containerX) + (charW - blockW) * (0.2 + Math.random() * 0.6);
                const offsetY = (charY - containerY) + (charH - blockH) * (0.2 + Math.random() * 0.6);

                const block = document.createElement('div');
                block.className = 'play-hide-block';
                block.style.width = blockW + 'px';
                block.style.height = blockH + 'px';
                block.style.left = offsetX + 'px';
                block.style.top = offsetY + 'px';
                block.style.animationDelay = -(Math.random() * 1000) + 'ms';

                blocks.push(block);
            }
        });

        // blocksをcontainerに追加し、positionParentに配置
        blocks.forEach(block => {
            container.appendChild(block);
            // 各ブロックのクリックで親コンテナ全体を散らす
            block.addEventListener('click', (e) => {
                e.stopPropagation();
                scatterBlocks(container);
            });
        });
        positionParent.appendChild(container);

        blockGroups.push({
            targetEl: targetEl,
            positionParent: positionParent,
            container: container,
            originalParentPosition: originalParentPosition,
        });
    }

    /**
     * インライン要素の最寄りのブロックレベル親要素を取得
     */
    function findBlockParent(el) {
        let parent = el.parentElement;
        while (parent) {
            const display = window.getComputedStyle(parent).display;
            if (display !== 'inline' && display !== 'inline-block') {
                return parent;
            }
            parent = parent.parentElement;
        }
        return document.body;
    }

    /* ==========================================================
       ブロック散らしアニメーション
       ========================================================== */
    function scatterBlocks(container) {
        if (container.dataset.scattered === 'true') return;
        container.dataset.scattered = 'true';

        const blocks = container.querySelectorAll('.play-hide-block');
        blocks.forEach(block => {
            // ランダムな方向・距離
            const angle = Math.random() * Math.PI * 2;
            const distance = SCATTER_DISTANCE * (0.5 + Math.random() * 0.5);
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            const rotation = (Math.random() - 0.5) * 720;

            block.style.transition = `transform ${SCATTER_DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity ${SCATTER_DURATION * 0.5}ms ease ${FADE_DELAY}ms`;
            block.style.transform = `translate(${tx}px, ${ty}px) rotate(${rotation}deg)`;
            block.style.opacity = '0';
            block.style.pointerEvents = 'none';
        });

        // アニメーション終了後にコンテナを削除
        setTimeout(() => {
            container.remove();
        }, SCATTER_DURATION + FADE_DELAY + 100);
    }

    /* ==========================================================
       遊びモード ON/OFF
       ========================================================== */
    function activatePlayMode() {
        if (isPlayMode) return;
        isPlayMode = true;

        const btn = document.getElementById('play-mode-btn');
        if (btn) btn.classList.add('is-active');

        // data-play-hide属性を持つ要素にブロックを生成
        const targets = document.querySelectorAll('[data-play-hide]');
        targets.forEach(el => {
            createBlocksForTarget(el);
        });
    }

    function deactivatePlayMode() {
        if (!isPlayMode) return;
        isPlayMode = false;

        const btn = document.getElementById('play-mode-btn');
        if (btn) btn.classList.remove('is-active');

        // 全ブロックコンテナを削除
        blockGroups.forEach(({ positionParent, container, originalParentPosition }) => {
            if (container.parentNode) {
                container.remove();
            }
            positionParent.style.position = originalParentPosition || '';
        });
        blockGroups = [];
    }

    function togglePlayMode() {
        if (isPlayMode) {
            deactivatePlayMode();
        } else {
            activatePlayMode();
        }
    }

    /* ==========================================================
       グローバルAPI
       ========================================================== */
    window.PlayMode = {
        activate: activatePlayMode,
        deactivate: deactivatePlayMode,
        toggle: togglePlayMode,
        isActive: () => isPlayMode,
    };

    /* ==========================================================
       イベントバインディング
       ========================================================== */
    document.addEventListener('DOMContentLoaded', () => {
        /* 遊びモードトグルボタン */
        const btn = document.getElementById('play-mode-btn');
        if (btn) {
            btn.addEventListener('click', togglePlayMode);
        }
    });
})();
