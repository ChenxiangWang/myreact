/**
 *  dom: 虚拟DOM
 *  container: 真实的DOM作为容器
 *
 * */


export default function render (vDom, container) {
    let dom;

    // 标签节点
    if (vDom.type !== 'TEXT_ELEMENT') {
        dom = document.createElement(vDom.type);
        Object.keys(vDom.props).forEach((key) => {
            if (key !== 'children') {
                dom[key] = vDom.props[key];
            }
        })
    // 文本节点
    } else {
        dom = document.createTextNode(vDom.props.nodeValue);
    }

    vDom?.props.children.forEach((child) => {
        render(child, dom);
    })

    container.appendChild(dom);
}