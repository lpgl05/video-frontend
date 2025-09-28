import React, { useRef, useEffect, useState } from 'react'
import { Card } from 'antd'
import type { FontStyle, TitleConfig } from '../types'

interface StylePreviewProps {
  titleStyle: TitleConfig
  subtitleStyle: FontStyle
  width?: number
  height?: number
  posterUrl?: string // 海报背景图片URL
}

const StylePreview: React.FC<StylePreviewProps> = ({
  titleStyle,
  subtitleStyle,
  width = 270,
  height = 480,
  posterUrl
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fontsLoaded, setFontsLoaded] = useState<Set<string>>(new Set())
  const [posterImage, setPosterImage] = useState<HTMLImageElement | null>(null)

  // 加载海报图片
  const loadPosterImage = async (url: string) => {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      
      // 对于本地或相对路径，不设置crossOrigin
      const isLocalOrRelative = !url.startsWith('http') || url.startsWith(window.location.origin)
      
      img.onload = () => {
        console.log('图片加载成功:', url)
        resolve(img)
      }
      
      img.onerror = (error) => {
        console.error('图片加载失败:', url, error)
        
        // 如果第一次失败，尝试不设置crossOrigin重新加载
        if (!isLocalOrRelative) {
          const img2 = new Image()
          img2.onload = () => {
            console.log('第二次尝试（无crossOrigin）加载成功:', url)
            resolve(img2)
          }
          img2.onerror = (error2) => {
            console.error('第二次尝试也失败:', url, error2)
            reject(error2)
          }
          // 不设置crossOrigin
          img2.src = url
        } else {
          reject(error)
        }
      }
      
      // 根据URL类型决定是否设置跨域
      if (!isLocalOrRelative) {
        img.crossOrigin = 'anonymous'
      }
      img.src = url
    })
  }

  // 加载自定义字体
  const loadFont = async (fontFamily: string, fontUrl?: string) => {
    if (!fontUrl || fontsLoaded.has(fontFamily)) return

    console.log(`尝试加载字体: ${fontFamily}, URL: ${fontUrl}`)

    // 方法1: 直接尝试加载字体
    try {
      const font = new FontFace(fontFamily, `url(${fontUrl})`)
      await font.load()
      document.fonts.add(font)
      setFontsLoaded(prev => new Set([...prev, fontFamily]))
      console.log(`字体加载成功: ${fontFamily}`)
      return
    } catch (error) {
      console.error(`直接加载字体失败 ${fontFamily}:`, error)
    }

    // 方法2: 尝试使用动态CSS方式加载
    try {
      console.log(`尝试使用CSS方式加载字体: ${fontFamily}`)
      
      // 创建CSS样式
      const style = document.createElement('style')
      style.textContent = `
        @font-face {
          font-family: '${fontFamily}';
          src: url('${fontUrl}') format('truetype');
          font-display: swap;
        }
      `
      document.head.appendChild(style)
      
      // 创建一个测试元素来触发字体加载
      const testElement = document.createElement('div')
      testElement.style.fontFamily = fontFamily
      testElement.style.position = 'absolute'
      testElement.style.left = '-9999px'
      testElement.style.fontSize = '1px'
      testElement.textContent = '测试'
      document.body.appendChild(testElement)
      
      // 等待一段时间后移除测试元素
      setTimeout(() => {
        document.body.removeChild(testElement)
        setFontsLoaded(prev => new Set([...prev, fontFamily]))
        console.log(`通过CSS方式加载字体: ${fontFamily}`)
      }, 100)
      
    } catch (cssError) {
      console.error(`CSS方式加载字体也失败了:`, cssError)
      console.warn(`建议将字体文件放到项目的public文件夹中，或配置服务器CORS头部`)
    }
  }

  // 绘制视频模拟效果
  const drawVideoSimulation = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    ctx.save()
    
    // 计算16:9视频区域 - 高度占背景一半
    const videoHeight = h * 0.5
    const videoWidth = videoHeight * (16 / 9)
    
    // 确保视频不超出屏幕宽度
    const actualVideoWidth = Math.min(videoWidth, w * 0.9)
    const actualVideoHeight = actualVideoWidth * (9 / 16)
    
    // 居中计算
    const videoX = x + (w - actualVideoWidth) / 2
    const videoY = y + (h - actualVideoHeight) / 2
    
    // 绘制视频区域背景
    ctx.fillStyle = 'rgba(60, 70, 80, 0.4)'
    ctx.fillRect(videoX, videoY, actualVideoWidth, actualVideoHeight)
    
    // 绘制模拟的视频场景元素（在视频区域内）
    // 1. 绘制几个模拟的人物轮廓
    ctx.fillStyle = 'rgba(100, 120, 140, 0.4)'
    
    // 人物轮廓1
    ctx.beginPath()
    ctx.ellipse(
      videoX + actualVideoWidth * 0.25, 
      videoY + actualVideoHeight * 0.4, 
      actualVideoWidth * 0.08, 
      actualVideoHeight * 0.12, 
      0, 0, Math.PI * 2
    )
    ctx.fill()
    
    // 人物轮廓2
    ctx.beginPath()
    ctx.ellipse(
      videoX + actualVideoWidth * 0.75, 
      videoY + actualVideoHeight * 0.6, 
      actualVideoWidth * 0.06, 
      actualVideoHeight * 0.1, 
      0, 0, Math.PI * 2
    )
    ctx.fill()
    
    // 2. 绘制模拟的建筑物轮廓
    ctx.fillStyle = 'rgba(80, 100, 120, 0.3)'
    
    // 建筑物1
    ctx.fillRect(
      videoX + actualVideoWidth * 0.1, 
      videoY + actualVideoHeight * 0.3, 
      actualVideoWidth * 0.15, 
      actualVideoHeight * 0.4
    )
    
    // 建筑物2
    ctx.fillRect(
      videoX + actualVideoWidth * 0.75, 
      videoY + actualVideoHeight * 0.25, 
      actualVideoWidth * 0.2, 
      actualVideoHeight * 0.5
    )
    
    // 3. 绘制一些装饰线条模拟动态效果
    ctx.strokeStyle = 'rgba(150, 170, 190, 0.2)'
    ctx.lineWidth = 1
    
    for (let i = 0; i < 5; i++) {
      ctx.beginPath()
      ctx.moveTo(
        videoX + actualVideoWidth * (0.1 + i * 0.2), 
        videoY + actualVideoHeight * 0.2
      )
      ctx.lineTo(
        videoX + actualVideoWidth * (0.15 + i * 0.2), 
        videoY + actualVideoHeight * 0.8
      )
      ctx.stroke()
    }
    
    // 4. 绘制模拟的光效
    const lightGradient = ctx.createRadialGradient(
      videoX + actualVideoWidth * 0.5, videoY + actualVideoHeight * 0.3, 0,
      videoX + actualVideoWidth * 0.5, videoY + actualVideoHeight * 0.3, actualVideoWidth * 0.3
    )
    lightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.08)')
    lightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    
    ctx.fillStyle = lightGradient
    ctx.fillRect(videoX, videoY, actualVideoWidth, actualVideoHeight)
    
    // 5. 绘制进度条模拟播放状态
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
    ctx.fillRect(
      videoX + actualVideoWidth * 0.05, 
      videoY + actualVideoHeight * 0.92, 
      actualVideoWidth * 0.9, 
      2
    )
    
    ctx.fillStyle = 'rgba(24, 144, 255, 0.9)'
    ctx.fillRect(
      videoX + actualVideoWidth * 0.05, 
      videoY + actualVideoHeight * 0.92, 
      actualVideoWidth * 0.4, 
      2
    )
    
    // 6. 绘制播放按钮
    const playButtonSize = Math.min(actualVideoWidth, actualVideoHeight) * 0.15
    const playButtonX = videoX + actualVideoWidth / 2
    const playButtonY = videoY + actualVideoHeight / 2
    
    // 播放按钮背景圆形
    ctx.fillStyle = 'rgba(240, 240, 240, 0.8)'
    ctx.beginPath()
    ctx.arc(playButtonX, playButtonY, playButtonSize, 0, Math.PI * 2)
    ctx.fill()
    
    // 播放按钮边框
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.9)'
    ctx.lineWidth = 2
    ctx.stroke()
    
    // 播放三角形
    ctx.fillStyle = 'rgba(100, 100, 100, 0.9)'
    ctx.beginPath()
    const triangleSize = playButtonSize * 0.4
    ctx.moveTo(playButtonX - triangleSize * 0.3, playButtonY - triangleSize * 0.6)
    ctx.lineTo(playButtonX - triangleSize * 0.3, playButtonY + triangleSize * 0.6)
    ctx.lineTo(playButtonX + triangleSize * 0.7, playButtonY)
    ctx.closePath()
    ctx.fill()
    
    // 7. 绘制"案例视频"标签
    ctx.fillStyle = 'rgba(50, 50, 50, 0.8)'
    ctx.fillRect(
      videoX + actualVideoWidth * 0.02,
      videoY + actualVideoHeight * 0.02,
      actualVideoWidth * 0.25,
      actualVideoHeight * 0.08
    )
    
    // 标签文字
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.font = `${Math.max(10, actualVideoWidth * 0.03)}px Microsoft YaHei, sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(
      '案例视频',
      videoX + actualVideoWidth * 0.145,
      videoY + actualVideoHeight * 0.065
    )
    
    ctx.restore()
  }

  // 绘制海报背景
  const drawPosterBackground = (
    ctx: CanvasRenderingContext2D, 
    img: HTMLImageElement, 
    x: number, 
    y: number, 
    width: number, 
    height: number
  ) => {
    // 计算图片的缩放比例，保持比例的同时填满整个区域
    const imgRatio = img.width / img.height
    const areaRatio = width / height
    
    let drawWidth, drawHeight, offsetX, offsetY
    
    if (imgRatio > areaRatio) {
      // 图片更宽，按高度缩放
      drawHeight = height
      drawWidth = height * imgRatio
      offsetX = (width - drawWidth) / 2
      offsetY = 0
    } else {
      // 图片更高，按宽度缩放
      drawWidth = width
      drawHeight = width / imgRatio
      offsetX = 0
      offsetY = (height - drawHeight) / 2
    }
    
    // 绘制海报图片
    ctx.drawImage(img, x + offsetX, y + offsetY, drawWidth, drawHeight)
    
    // 添加一个半透明遮罩层，确保文字可读性
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.fillRect(x, y, width, height)
  }

  // 绘制手机壳
  const drawPhoneFrame = (ctx: CanvasRenderingContext2D) => {
    const frameThickness = 12
    const cornerRadius = 25
    const screenPadding = 8
    
    // 绘制手机外壳
    ctx.save()
    
    // 外壳渐变色
    const frameGradient = ctx.createLinearGradient(0, 0, width, height)
    frameGradient.addColorStop(0, '#1a1a1a')
    frameGradient.addColorStop(0.5, '#2a2a2a')
    frameGradient.addColorStop(1, '#1a1a1a')
    
    // 绘制圆角矩形外壳
    ctx.fillStyle = frameGradient
    roundRect(ctx, 0, 0, width, height, cornerRadius)
    ctx.fill()
    
    // 绘制内部屏幕区域（挖空效果）
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.roundRect(
      frameThickness, 
      frameThickness + 20, 
      width - frameThickness * 2, 
      height - frameThickness * 2 - 40, 
      cornerRadius - 8
    )
    ctx.fill()
    
    ctx.restore()
    
    // 绘制听筒
    ctx.fillStyle = '#333'
    ctx.beginPath()
    ctx.roundRect(width / 2 - 25, 8, 50, 4, 2)
    ctx.fill()
    
    // 绘制前置摄像头
    ctx.fillStyle = '#111'
    ctx.beginPath()
    ctx.arc(width / 2 + 40, 12, 3, 0, Math.PI * 2)
    ctx.fill()
    
    // 绘制底部home指示器
    ctx.fillStyle = '#444'
    ctx.beginPath()
    ctx.roundRect(width / 2 - 30, height - 12, 60, 3, 2)
    ctx.fill()
  }

  // 绘制预览
  const drawPreview = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 清空画布
    ctx.clearRect(0, 0, width, height)
    
    // 绘制手机壳
    drawPhoneFrame(ctx)

    // 计算屏幕内容区域
    const screenX = 12
    const screenY = 32
    const screenWidth = width - 24
    const screenHeight = height - 64

    // 设置裁剪区域为屏幕内部
    ctx.save()
    roundRect(ctx, screenX, screenY, screenWidth, screenHeight, 17)
    ctx.clip()

    // 绘制背景
    console.log('绘制背景, posterImage:', posterImage ? '有图片' : '无图片')
    if (posterImage) {
      // 如果有海报图片，使用海报作为背景
      console.log('绘制海报背景')
      drawPosterBackground(ctx, posterImage, screenX, screenY, screenWidth, screenHeight)
    } else {
      // 否则使用默认的深灰色渐变模拟视频背景
      console.log('绘制默认背景')
      const gradient = ctx.createLinearGradient(screenX, screenY, screenX + screenWidth, screenY + screenHeight)
      gradient.addColorStop(0, '#404040')
      gradient.addColorStop(1, '#2a2a2a')
      ctx.fillStyle = gradient
      ctx.fillRect(screenX, screenY, screenWidth, screenHeight)
      
      // 添加视频模拟效果
      drawVideoSimulation(ctx, screenX, screenY, screenWidth, screenHeight)
    }

    // 绘制标题（支持主副标题）
    drawTitleWithSubtitle(ctx, titleStyle, screenWidth, screenHeight, screenX, screenY)

    // 绘制字幕
    drawText(ctx, '示例字幕文本', subtitleStyle, screenWidth, screenHeight, 'subtitle', screenX, screenY)
    
    ctx.restore()
  }

  // 在组件顶层打印收到的 style（仅用于调试）
  useEffect(() => {
    try {
      console.log('StylePreview props - titleStyle:', titleStyle)
      console.log('StylePreview props - subtitleStyle:', subtitleStyle)
    } catch (e) {
      // ignore
    }
  }, [titleStyle && JSON.stringify(titleStyle), subtitleStyle && JSON.stringify(subtitleStyle)])

  // 新增：兼容的 roundRect 辅助（在多个地方替代 ctx.roundRect，防止部分浏览器报错）
  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
	// 如果原生支持则直接调用
	// @ts-ignore
	if (typeof ctx.roundRect === 'function') {
		// @ts-ignore
		ctx.beginPath()
		// @ts-ignore
		ctx.roundRect(x, y, w, h, r)
		return
	}
	// 回退实现
	const radius = Math.min(r, Math.floor(Math.min(w, h) / 2))
	ctx.beginPath()
	ctx.moveTo(x + radius, y)
	ctx.lineTo(x + w - radius, y)
	ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
	ctx.lineTo(x + w, y + h - radius)
	ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
	ctx.lineTo(x + radius, y + h)
	ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
	ctx.lineTo(x, y + radius)
	ctx.quadraticCurveTo(x, y, x + radius, y)
	ctx.closePath()
}

  // 绘制文本的函数
  const drawText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    style: FontStyle,
    canvasWidth: number,
    canvasHeight: number,
    type: 'title' | 'subtitle',
    offsetX: number = 0,
    offsetY: number = 0
  ) => {
    try {
      // 防御性确保 style 不为 null/undefined
      if (!style || typeof style !== 'object') {
        style = {} as FontStyle
      }

      // 修正：实际视频尺寸为1080x1920(竖屏)，但后端按1080宽度处理
      const actualVideoWidth = 1080  // 后端实际使用的视频宽度
      const previewVideoHeight = canvasHeight * 0.5 // 视频高度占画布一半
      const previewVideoWidth = previewVideoHeight * (16 / 9)
      
      // 确保不超出画布宽度
      const actualPreviewWidth = Math.min(previewVideoWidth, canvasWidth * 0.9)
      
      // 计算字体缩放比例（基于宽度比例，因为后端以宽度为准）
      const fontScale = actualPreviewWidth / actualVideoWidth
      const rawFontSize = (style && typeof style.fontSize === 'number') ? style.fontSize : (type === 'title' ? 64 : 48)
      
      // 如果字体大小为0，则不显示文本
      if (rawFontSize <= 0) {
        return
      }
      
      const scaledFontSize = Math.max(6, Math.round(rawFontSize * fontScale)) // 最小字体6px
      
      // 设置字体
      let fontFamily = style.fontFamily || 'Microsoft YaHei, sans-serif'
      
      // 检查是否是自定义字体并且已加载
      if (style.fontUrl && fontsLoaded.has(style.fontFamily)) {
        // ok
      } else if (style.fontUrl && !fontsLoaded.has(style.fontFamily)) {
        fontFamily = 'Microsoft YaHei, sans-serif' // 备用字体
      }
      
      let fontString = `${scaledFontSize}px "${fontFamily}"`
      if (style.bold) fontString = `bold ${fontString}`
      if (style.italic) fontString = `italic ${fontString}`
      ctx.font = fontString

      // 测量文本（优先使用 actualBoundingBox 系列）
      const metrics = ctx.measureText(text)
      const textWidth = metrics.width || (text.length * scaledFontSize * 0.6)
      const ascent = (metrics.actualBoundingBoxAscent !== undefined) ? metrics.actualBoundingBoxAscent : Math.round(scaledFontSize * 0.8)
      const descent = (metrics.actualBoundingBoxDescent !== undefined) ? metrics.actualBoundingBoxDescent : Math.round(scaledFontSize * 0.25)
      const textHeight = ascent + descent

      // 计算文本基线位置
      let x: number
      let y: number
      
      // X坐标：所有位置都水平居中
      x = offsetX + (canvasWidth - textWidth) / 2 // 水平居中，加上偏移

      switch (style.position) {
        case 'top':
          y = offsetY + (type === 'title' ? ascent + 20 : ascent + 60)
          break
        case 'center':
          y = offsetY + canvasHeight / 2 + (type === 'title' ? -textHeight/2 : textHeight/2)
          break
        case 'bottom':
          y = offsetY + canvasHeight - (type === 'title' ? textHeight + 60 : textHeight + 20)
          y += ascent // baseline adjust
          break
        case 'template1':
          // 模板位置1：距上边框1372.4像素 (按1920高度比例计算预览位置)，水平居中
          const templateY = 1372.4
          const previewRatio = canvasHeight / 1920  // 预览画布与实际视频的比例
          y = offsetY + templateY * previewRatio + ascent
          break
        default:
          y = offsetY + canvasHeight / 2
      }

      // 先绘制背景（若有），若无则对 title 使用默认背景回退（#CEC970, alpha=0）
      let bg = parseBackgroundToRgbaForCanvas(style)
      if (!bg) {
        if (type === 'title') {
          const fallback = hexToRgba('#CEC970', 0)
          if (fallback) bg = fallback
        } else if (type === 'subtitle') {
          // 为字幕提供默认白色背景（与 ConfigSettings 中的默认一致）
          const fallbackSub = hexToRgba('#FFFFFF', 0)
          if (fallbackSub) bg = fallbackSub
        }
      }

      // 调试：打印解析后的背景 rgba（a 为 0-1）
      try {
        console.log(`drawText parsed bg - type=${type}`, bg)
      } catch (e) {}
      
      if (bg) {
        const padX = Math.max(8, 8 * fontScale)
        const padY = Math.max(6, 4 * fontScale)
        const rectX = x - padX
        const rectY = y - ascent - padY
        const rectW = textWidth + padX * 2
        const rectH = textHeight + padY * 2

        ctx.save()
        const radius = Math.min(8, Math.floor(padY + 2))
        // 再次确保 alpha 在 0-1 范围
        const alpha = typeof bg.a === 'number' ? Math.max(0, Math.min(1, bg.a)) : 1
        ctx.fillStyle = `rgba(${bg.r}, ${bg.g}, ${bg.b}, ${alpha})`
        if (radius > 0) {
          ctx.beginPath()
          ctx.moveTo(rectX + radius, rectY)
          ctx.lineTo(rectX + rectW - radius, rectY)
          ctx.quadraticCurveTo(rectX + rectW, rectY, rectX + rectW, rectY + radius)
          ctx.lineTo(rectX + rectW, rectY + rectH - radius)
          ctx.quadraticCurveTo(rectX + rectW, rectY + rectH, rectX + rectW - radius, rectY + rectH)
          ctx.lineTo(rectX + radius, rectY + rectH)
          ctx.quadraticCurveTo(rectX, rectY + rectH, rectX, rectY + rectH - radius)
          ctx.lineTo(rectX, rectY + radius)
          ctx.quadraticCurveTo(rectX, rectY, rectX + radius, rectY)
          ctx.closePath()
          ctx.fill()
        } else {
          ctx.fillRect(rectX, rectY, rectW, rectH)
        }
        ctx.restore()
      }

      // 绘制描边（如果有）
      if (style.strokeColor && style.strokeWidth && style.strokeWidth > 0) {
        ctx.save()
        ctx.strokeStyle = style.strokeColor
        const scaledStrokeWidth = Math.max(0.5, (style.strokeWidth || 1) * fontScale)
        ctx.lineWidth = scaledStrokeWidth * 2
        ctx.lineJoin = 'round'
        ctx.miterLimit = 2
        ctx.strokeText(text, x, y)
        ctx.restore()
      }

      // 绘制阴影或主文本
      if (style.shadow && style.shadowColor) {
        ctx.save()
        ctx.shadowColor = style.shadowColor
        ctx.shadowBlur = Math.max(1, 4 * fontScale)
        ctx.shadowOffsetX = Math.max(0.5, 2 * fontScale)
        ctx.shadowOffsetY = Math.max(0.5, 2 * fontScale)
        ctx.fillStyle = style.color || '#ffffff'
        ctx.fillText(text, x, y)
        ctx.restore()
      } else {
        ctx.fillStyle = style.color || '#ffffff'
        ctx.fillText(text, x, y)
      }
    } catch (err) {
      console.error('drawText error:', err, { text, type, style })
      // 防止失败阻塞整个预览绘制，返回即可
      return
    }
  }

  // 绘制主副标题
  const drawTitleWithSubtitle = (
    ctx: CanvasRenderingContext2D,
    titleConfig: TitleConfig,
    canvasWidth: number,
    canvasHeight: number,
    offsetX: number = 0,
    offsetY: number = 0
  ) => {
    try {
      // 获取主副标题配置
      const mainTitle = titleConfig.mainTitle
      const subTitle = titleConfig.subTitle
      const spacing = titleConfig.spacing || 20
      const alignment = titleConfig.alignment || 'center'
      
      // 如果没有主副标题，尝试使用旧版本兼容模式
      if (!mainTitle && !subTitle) {
        if (titleConfig.fontSize && titleConfig.fontSize > 0) {
          const legacyStyle: FontStyle = {
            color: titleConfig.color || '#000000',
            position: titleConfig.position || 'top',
            fontSize: titleConfig.fontSize,
            fontFamily: titleConfig.fontFamily,
            fontUrl: titleConfig.fontUrl,
            bold: titleConfig.bold,
            italic: titleConfig.italic,
            shadow: titleConfig.shadow,
            shadowColor: titleConfig.shadowColor,
            strokeColor: titleConfig.strokeColor,
            strokeWidth: titleConfig.strokeWidth
          }
          drawText(ctx, '示例标题文本', legacyStyle, canvasWidth, canvasHeight, 'title', offsetX, offsetY)
        }
        return
      }
      
      // 计算整体标题区域的位置
      const actualVideoWidth = 1080
      const previewVideoHeight = canvasHeight * 0.5
      const previewVideoWidth = previewVideoHeight * (16 / 9)
      const actualPreviewWidth = Math.min(previewVideoWidth, canvasWidth * 0.9)
      const fontScale = actualPreviewWidth / actualVideoWidth
      
      let titleAreaY = offsetY
      
      // 根据位置计算标题区域的Y位置
      switch (titleConfig.position) {
        case 'top':
          titleAreaY = offsetY + 20
          break
        case 'center':
          titleAreaY = offsetY + canvasHeight / 2 - 50
          break
        case 'bottom':
          titleAreaY = offsetY + canvasHeight - 100
          break
        case 'template1':
          const templateY = 1372.4
          const previewRatio = canvasHeight / 1920
          titleAreaY = offsetY + templateY * previewRatio - 50
          break
        default:
          titleAreaY = offsetY + 20
      }
      
      let currentY = titleAreaY
      
      // 绘制主标题
      if (mainTitle && mainTitle.fontSize > 0) {
        const displayText = mainTitle.text || '主标题示例'
        const mainTitleStyle: FontStyle = {
          color: mainTitle.color || '#000000',
          position: 'top', // 使用绝对位置
          fontSize: mainTitle.fontSize,
          fontFamily: mainTitle.fontFamily,
          fontUrl: mainTitle.fontUrl,
          bold: mainTitle.bold,
          italic: mainTitle.italic,
          shadow: mainTitle.shadow,
          shadowColor: mainTitle.shadowColor,
          strokeColor: mainTitle.strokeColor,
          strokeWidth: mainTitle.strokeWidth
        }
        
        // 使用绝对位置绘制主标题
        drawTextAtPosition(ctx, displayText, mainTitleStyle, canvasWidth, canvasHeight, offsetX, currentY, alignment)
        
        // 计算主标题高度用于间距计算
        const mainFontSize = Math.max(6, Math.round(mainTitle.fontSize * fontScale))
        currentY += mainFontSize + (spacing * fontScale)
      }
      
      // 绘制副标题
      if (subTitle && subTitle.fontSize > 0) {
        const displayText = subTitle.text || '副标题示例'
        const subTitleStyle: FontStyle = {
          color: subTitle.color || '#ffff00',  // 副标题默认黄色
          position: 'top', // 使用绝对位置
          fontSize: subTitle.fontSize,
          fontFamily: subTitle.fontFamily,
          fontUrl: subTitle.fontUrl,
          bold: subTitle.bold,
          italic: subTitle.italic,
          shadow: subTitle.shadow,
          shadowColor: subTitle.shadowColor,
          strokeColor: subTitle.strokeColor,
          strokeWidth: subTitle.strokeWidth
        }
        
        // 使用绝对位置绘制副标题
        drawTextAtPosition(ctx, displayText, subTitleStyle, canvasWidth, canvasHeight, offsetX, currentY, alignment)
      }
      
    } catch (err) {
      console.error('drawTitleWithSubtitle error:', err)
      // 失败时使用默认文本
      const fallbackStyle: FontStyle = {
        color: '#000000',
        position: titleConfig.position || 'top',
        fontSize: 32
      }
      drawText(ctx, '标题预览', fallbackStyle, canvasWidth, canvasHeight, 'title', offsetX, offsetY)
    }
  }
  
  // 在指定位置绘制文本的辅助函数
  const drawTextAtPosition = (
    ctx: CanvasRenderingContext2D,
    text: string,
    style: FontStyle,
    canvasWidth: number,
    canvasHeight: number,
    offsetX: number,
    absoluteY: number,
    alignment: 'left' | 'center' | 'right'
  ) => {
    try {
      const actualVideoWidth = 1080
      const previewVideoHeight = canvasHeight * 0.5
      const previewVideoWidth = previewVideoHeight * (16 / 9)
      const actualPreviewWidth = Math.min(previewVideoWidth, canvasWidth * 0.9)
      const fontScale = actualPreviewWidth / actualVideoWidth
      const scaledFontSize = Math.max(6, Math.round(style.fontSize * fontScale))
      
      // 设置字体
      let fontFamily = style.fontFamily || 'Microsoft YaHei, sans-serif'
      if (style.fontUrl && fontsLoaded.has(style.fontFamily)) {
        // 使用自定义字体
      } else if (style.fontUrl && !fontsLoaded.has(style.fontFamily)) {
        fontFamily = 'Microsoft YaHei, sans-serif'
      }
      
      let fontString = `${scaledFontSize}px "${fontFamily}"`
      if (style.bold) fontString = `bold ${fontString}`
      if (style.italic) fontString = `italic ${fontString}`
      ctx.font = fontString
      
      // 测量文本
      const metrics = ctx.measureText(text)
      const textWidth = metrics.width || (text.length * scaledFontSize * 0.6)
      const ascent = (metrics.actualBoundingBoxAscent !== undefined) ? metrics.actualBoundingBoxAscent : Math.round(scaledFontSize * 0.8)
      const descent = (metrics.actualBoundingBoxDescent !== undefined) ? metrics.actualBoundingBoxDescent : Math.round(scaledFontSize * 0.25)
      const textHeight = ascent + descent
      
      // 计算X位置
      let x: number
      switch (alignment) {
        case 'left':
          x = offsetX + 20
          break
        case 'right':
          x = offsetX + canvasWidth - textWidth - 20
          break
        case 'center':
        default:
          x = offsetX + (canvasWidth - textWidth) / 2
          break
      }
      
      const y = absoluteY + ascent
      
      // 绘制背景（如果有）
      const bg = parseBackgroundToRgbaForCanvas(titleStyle)
      if (bg) {
        const padX = Math.max(8, 8 * fontScale)
        const padY = Math.max(6, 4 * fontScale)
        const rectX = x - padX
        const rectY = y - ascent - padY
        const rectW = textWidth + padX * 2
        const rectH = textHeight + padY * 2
        
        ctx.save()
        const alpha = typeof bg.a === 'number' ? Math.max(0, Math.min(1, bg.a)) : 1
        ctx.fillStyle = `rgba(${bg.r}, ${bg.g}, ${bg.b}, ${alpha})`
        const radius = Math.min(8, Math.floor(padY + 2))
        if (radius > 0) {
          ctx.beginPath()
          ctx.moveTo(rectX + radius, rectY)
          ctx.lineTo(rectX + rectW - radius, rectY)
          ctx.quadraticCurveTo(rectX + rectW, rectY, rectX + rectW, rectY + radius)
          ctx.lineTo(rectX + rectW, rectY + rectH - radius)
          ctx.quadraticCurveTo(rectX + rectW, rectY + rectH, rectX + rectW - radius, rectY + rectH)
          ctx.lineTo(rectX + radius, rectY + rectH)
          ctx.quadraticCurveTo(rectX, rectY + rectH, rectX, rectY + rectH - radius)
          ctx.lineTo(rectX, rectY + radius)
          ctx.quadraticCurveTo(rectX, rectY, rectX + radius, rectY)
          ctx.closePath()
          ctx.fill()
        } else {
          ctx.fillRect(rectX, rectY, rectW, rectH)
        }
        ctx.restore()
      }
      
      // 绘制描边（如果有）
      if (style.strokeColor && style.strokeWidth && style.strokeWidth > 0) {
        ctx.save()
        ctx.strokeStyle = style.strokeColor
        const scaledStrokeWidth = Math.max(0.5, (style.strokeWidth || 1) * fontScale)
        ctx.lineWidth = scaledStrokeWidth * 2
        ctx.lineJoin = 'round'
        ctx.miterLimit = 2
        ctx.strokeText(text, x, y)
        ctx.restore()
      }
      
      // 绘制阴影或主文本
      if (style.shadow && style.shadowColor) {
        ctx.save()
        ctx.shadowColor = style.shadowColor
        ctx.shadowBlur = Math.max(1, 4 * fontScale)
        ctx.shadowOffsetX = Math.max(0.5, 2 * fontScale)
        ctx.shadowOffsetY = Math.max(0.5, 2 * fontScale)
        ctx.fillStyle = style.color || '#000000'
        ctx.fillText(text, x, y)
        ctx.restore()
      } else {
        ctx.fillStyle = style.color || '#000000'
        ctx.fillText(text, x, y)
      }
      
    } catch (err) {
      console.error('drawTextAtPosition error:', err)
    }
  }

  // 新增工具：将 hex 和 alpha(0-255或0-1) 转为 {r,g,b,a(0-1)}
  const hexToRgba = (hex: string, alpha?: number) => {
    if (!hex) return null
    const s = hex.trim().replace(/^#/, '')
    if (!/^[0-9a-fA-F]{6}$/.test(s)) return null
    const r = parseInt(s.slice(0,2), 16)
    const g = parseInt(s.slice(2,4), 16)
    const b = parseInt(s.slice(4,6), 16)
    let a = 1
    if (alpha !== undefined && alpha !== null) {
      const n = Number(alpha)
      if (!Number.isNaN(n)) a = n <= 1 ? n : Math.max(0, Math.min(1, n / 255))
    }
    return { r, g, b, a }
  }

  // 修改：从 style 中解析背景并返回 { r,g,b,a }，a 为 0-1（不再使用 section.color 作为背景）
  function parseBackgroundToRgbaForCanvas(section: any) {
    if (!section) return null
    let color: any = null
    let opacity: any = null

    // nested background object 优先
    if (section.background && typeof section.background === 'object') {
      color = section.background.background_color || section.background.color || section.background.backgroundColor
      opacity = section.background.background_opacity ?? section.background.opacity ?? section.background.alpha
    }

    // flat background fields（不要读取 section.color）
    color = color || section.background_color || section.background

    opacity = opacity ?? section.background_opacity ?? section.opacity

    if (!color) return null

    const s = String(color).trim()

    // rgba(...) / rgb(...)
    if (s.toLowerCase().startsWith('rgba')) {
      const m = s.match(/rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/i)
      if (m) return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a: Number(m[4]) }
    }
    if (s.toLowerCase().startsWith('rgb')) {
      const m = s.match(/rgb\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/i)
      if (m) return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a: 1 }
    }

    // hex handling (#RRGGBB or RRGGBB)
    const hex = s.startsWith('#') ? s.slice(1) : s
    if (/^[0-9a-fA-F]{6}$/.test(hex)) {
      const r = parseInt(hex.slice(0,2), 16)
      const g = parseInt(hex.slice(2,4), 16)
      const b = parseInt(hex.slice(4,6), 16)
      // 解析 opacity：支持 "50", "50%", 0.2, "0.2", 200（0-255）
      let a = 1
      if (opacity !== undefined && opacity !== null) {
        try {
          const opRaw = String(opacity).trim()
          if (opRaw.endsWith('%')) {
            // 百分比 e.g. "50%"
            const num = parseFloat(opRaw.slice(0, -1))
            if (!Number.isNaN(num)) a = Math.max(0, Math.min(1, num / 100))
          } else {
            const num = Number(opRaw)
            if (!Number.isNaN(num)) {
              // 如果在0-1之间，直接使用；如果大于1且<=255，按255缩放
              if (num >= 0 && num <= 1) a = num
              else if (num > 1 && num <= 255) a = Math.max(0, Math.min(1, num / 255))
              else {
                // 使用默认(1)
                a = Math.max(0, Math.min(1, num))
              }
            }
          }
        } catch (e) {
          a = 1
        }
      }
      return { r, g, b, a }
    }

    return null
  }

  // 当样式改变时重新绘制
  // 加载海报图片的useEffect
  useEffect(() => {
    console.log('posterUrl changed:', posterUrl)
    if (posterUrl) {
      // 处理URL格式，确保是完整的URL
      let fullUrl = posterUrl
      
      // 如果是相对路径，转换为绝对路径
      if (!posterUrl.startsWith('http')) {
        // 处理本地开发环境和OSS URL
        if (posterUrl.startsWith('/')) {
          // 如果是以/开头的路径，直接使用
          fullUrl = posterUrl
        } else if (posterUrl.includes('oss-') || posterUrl.includes('aliyuncs.com')) {
          // 如果是OSS URL但缺少协议，添加https
          fullUrl = posterUrl.startsWith('//') ? `https:${posterUrl}` : `https://${posterUrl}`
        } else {
          // 其他情况，作为相对路径处理
          fullUrl = `/${posterUrl}`
        }
      }
      
      console.log('开始加载海报图片:', fullUrl)
      loadPosterImage(fullUrl)
        .then(img => {
          setPosterImage(img)
          console.log('海报图片加载成功, 尺寸:', img.width, 'x', img.height)
        })
        .catch(error => {
          console.error('海报图片加载失败:', error)
          // 如果加载失败，尝试直接使用原始URL（不设置crossOrigin）
          const fallbackImg = new Image()
          fallbackImg.onload = () => {
            setPosterImage(fallbackImg)
            console.log('备用方案加载海报成功')
          }
          fallbackImg.onerror = () => {
            console.error('所有海报加载方案都失败了')
            setPosterImage(null)
          }
          fallbackImg.src = posterUrl
        })
    } else {
      console.log('没有海报URL，清除海报图片')
      setPosterImage(null)
    }
  }, [posterUrl])

  useEffect(() => {
    const loadFonts = async () => {
      const fontsToLoad = []
      
      // 加载主标题字体
      if (titleStyle.mainTitle?.fontFamily) {
        fontsToLoad.push(loadFont(titleStyle.mainTitle.fontFamily, titleStyle.mainTitle.fontUrl))
      }
      
      // 加载副标题字体
      if (titleStyle.subTitle?.fontFamily) {
        fontsToLoad.push(loadFont(titleStyle.subTitle.fontFamily, titleStyle.subTitle.fontUrl))
      }
      
      // 兼容旧版本：如果没有主副标题但有旧的fontFamily属性
      if (!titleStyle.mainTitle && !titleStyle.subTitle && titleStyle.fontFamily) {
        fontsToLoad.push(loadFont(titleStyle.fontFamily, titleStyle.fontUrl))
      }
      
      // 加载字幕字体
      if (subtitleStyle.fontFamily) {
        fontsToLoad.push(loadFont(subtitleStyle.fontFamily, subtitleStyle.fontUrl))
      }
      
      await Promise.all(fontsToLoad)
      // 延迟一下确保字体加载完成
      setTimeout(drawPreview, 100)
    }

    loadFonts()
  }, [titleStyle, subtitleStyle, width, height, fontsLoaded, posterImage])

  // 当海报图片状态改变时，强制重新绘制
  useEffect(() => {
    console.log('posterImage状态改变，强制重新绘制')
    setTimeout(drawPreview, 50)
  }, [posterImage])

  // 监听 title/subtitle 的 background 对象变化（包括 background_color/background_opacity），变动时强制重绘
  useEffect(() => {
    try {
      const tBg = titleStyle && (titleStyle as any).background ? JSON.stringify((titleStyle as any).background) : ''
      const sBg = subtitleStyle && (subtitleStyle as any).background ? JSON.stringify((subtitleStyle as any).background) : ''
      const key = `${tBg}|${sBg}`
      // 小延迟以确保状态稳定后绘制
      const id = setTimeout(() => {
        // console.log('背景变化触发绘制', key)
        drawPreview()
      }, 50)
      return () => clearTimeout(id)
    } catch (e) {
      // 出错也尝试重绘一次
      setTimeout(drawPreview, 50)
    }
  }, [
    // 也列出常用字段以提高命中率（某些环境 props 可能被逐个修改）
    (titleStyle as any)?.background?.background_color,
    (titleStyle as any)?.background?.background_opacity,
    (titleStyle as any)?.background?.opacity,
    (subtitleStyle as any)?.background?.background_color,
    (subtitleStyle as any)?.background?.background_opacity,
    (subtitleStyle as any)?.background?.opacity
  ])

  // 新增：深度监听 style 对象变化，确保嵌套字段（如 background.background_opacity）更新时也会重绘
  useEffect(() => {
    // 使用 JSON.stringify 深度比较（注意性能：这里只用于小对象的预览）
    const t = titleStyle ? JSON.stringify(titleStyle) : ''
    const s = subtitleStyle ? JSON.stringify(subtitleStyle) : ''
    const id = setTimeout(() => {
      // 强制重绘（保证任何内部字段变化都会反映）
      drawPreview()
    }, 30)
    return () => clearTimeout(id)
  }, [titleStyle && JSON.stringify(titleStyle), subtitleStyle && JSON.stringify(subtitleStyle), posterImage, fontsLoaded])

  return (
    <Card title="样式预览" size="small" style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px' }}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            borderRadius: '25px',
            backgroundColor: 'transparent',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
          }}
        />
      </div>
      <div style={{ 
        marginTop: 8, 
        fontSize: '12px', 
        color: '#666', 
        textAlign: 'center' 
      }}>
        预览效果 ({width} × {height})
        <br />
        <span style={{ fontSize: '11px', color: '#999' }}>
          字体已按比例缩放至预览尺寸
        </span>
        {posterUrl && (
          <div style={{ marginTop: 4 }}>
            <button 
              onClick={() => {
                console.log('手动刷新预览')
                drawPreview()
              }}
              style={{ fontSize: '10px', padding: '2px 6px' }}
            >
              刷新预览
            </button>
          </div>
        )}
      </div>
    </Card>
  )
}

export default StylePreview
