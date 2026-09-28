import React, { Children, cloneElement, isValidElement, useLayoutEffect } from 'react'

export function MotionHeading({as:Tag='h2',children,...props}) {
  let index=0
  function words(nodes){return Children.map(nodes,node=>{
    if(typeof node==='string')return node.split(/(\s+)/).map((word,i)=>/^\s+$/.test(word)?word:<span className="ns-motion-word" key={i} style={{'--word-delay':`${Math.min(index++,14)*35}ms`}}>{word}</span>)
    if(isValidElement(node)&&node.type!=='svg'&&node.props.children)return cloneElement(node,{},words(node.props.children))
    return node
  })}
  return <Tag {...props} data-motion-heading>{words(children)}</Tag>
}

export function useLandingMotion(root,route){
  useLayoutEffect(()=>{
    const page=root.current;if(!page)return
    const media=window.matchMedia('(prefers-reduced-motion: reduce)')
    let observer,frame=0,targets=[]
    function stop(){observer?.disconnect();cancelAnimationFrame(frame);page.classList.remove('ns-motion-active');targets.forEach(el=>{el.classList.remove('ns-motion-pending');el.style.removeProperty('--reveal-delay')});page.style.removeProperty('--stage-depth')}
    function start(){stop();if(media.matches||!window.IntersectionObserver)return
      targets=[...page.querySelectorAll('[data-motion-heading],.ns-hero>.ns-eyebrow,.ns-hero>p,.ns-hero-actions,.ns-hero-note,.ns-product-stage,.ns-section-heading>.ns-kicker,.ns-section-heading>p,.ns-support>p,.ns-support>div>span,.ns-features>article,.ns-discover>a,.ns-school-photo,.ns-school-section .ns-school-copy,.ns-tabs,.ns-workflow-panel,.ns-faq-list>article,.ns-final>p,.ns-final>.ns-button')]
      targets.forEach(el=>{el.classList.add('ns-motion-pending');el.classList.remove('ns-motion-visible');const siblings=[...el.parentElement.children];el.style.setProperty('--reveal-delay',`${Math.min(siblings.indexOf(el),4)*65}ms`)})
      page.classList.add('ns-motion-active')
      observer=new IntersectionObserver(entries=>{entries.forEach(({target,isIntersecting})=>{if(isIntersecting){target.classList.add('ns-motion-visible');observer.unobserve(target)}})},{threshold:0,rootMargin:'0px 0px -35px 0px'})
      targets.forEach(el=>observer.observe(el))
      depth()
    }
    function depth(){if(frame||media.matches)return;frame=requestAnimationFrame(()=>{frame=0;const hero=page.querySelector('.ns-hero');if(!hero)return;const rect=hero.getBoundingClientRect();const shift=Math.min(18,Math.max(0,-rect.top)*.025);page.style.setProperty('--stage-depth',`${shift}px`)})}
    function focus(event){targets.filter(el=>el.contains(event.target)).forEach(el=>el.classList.add('ns-motion-visible'))}
    start();media.addEventListener('change',start);window.addEventListener('scroll',depth,{passive:true});page.addEventListener('focusin',focus)
    return()=>{stop();media.removeEventListener('change',start);window.removeEventListener('scroll',depth);page.removeEventListener('focusin',focus)}
  },[root,route])
}
