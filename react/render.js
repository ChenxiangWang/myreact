/**
 *
 *  render 升级后运作流：
 *  1.  构建一个root fiber 作为梦想的起始点～
 *  2.  以 root fiber 为起点工作单元 开始工作
 *  3.  performUnitWork其实可以看作是调度生成下一个工作单元的任务
 *
 * */

function createDom (fiber) {
    const dom =
        fiber.type === "TEXT_ELEMENT"
            ? document.createTextNode(fiber);
            : document.createElement(fiber.type);
    const isProperty = key => key !== "children";
    Object.keys(fiber.props)
        .filter(isProperty)
        .forEach(name => {
            dom[name] = fiber.props[name];
        })
}


/**
 *  render 其实做的事情并不多，根据vDOm生成的一个 root fiber 节点
 *  这个 root fiber 是 react梦的起点～
 * */
export default function render (vDom, container) {
    let rootFiber = {
        dom: container,
        props: {
            children: [element],
        },
    }
    nextUnitOfWork = rootFiber;
}

let nextUnitOfWork = null;

/**
 *  快乐循环工作流
 *  工作 ---> 是否应该放弃 ---> 工作 ----> 是否应该放弃 。。。。
 */

function workLoop (deadline) {
    let hasRunOutOfTime = false; // 检查这一次循环是否还有充足的时间
    while (nextUnitOfWork && !hasRunOutOfTime) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    }
    hasRunOutOfTime = deadline.timeRemaining() < 1;
    requestIdleCallback(workLoop);
}


/**
 *  每一个工作单元的做的事情, 任务不多 3件事
 *  1. 添加dom
 *  2. 为儿子们创建fiber
 *  3. 返回下一个应该做的事
 * */
function performUnitOfWork (fiber) {
    if (!fiber.dom) {
        fib.dom = createDom(fiber);
    }
    // 1. 添加dom
    if (fiber.parent) {
        fiber.return.dom.appendChild(fiber.dom);
    }

    // 2. 生成儿子们的fiber 并且完成 father ---> first son ---> sibling ---> .... 关系建立
    const childrenVDom = fiber.props.children;
    let leftHandSideSibling = null; // 刚开始左手边的兄弟肯定是没有滴
    let index = 0;
    while (index < childrenVDom.length) {
        const childVDom = childrenVDom[index];
        const childFiber = {  // 根据 vdom 生成一个新的 fiber节点
            type: childVDom.type,
            props: childVDom.props,
            parent: fiber,
            dom: null;
        }

        if (index === 0) {
            fiber.child = childFiber;
        } else {
            leftHandSideSibling.sibling = childFiber;
        }
        prevSibling = childFiber;
        index ++;
    }

    // 有孩子返回孩子
    if (fiber.child) {
        return fiber.child;
    }

    let nextFiber = fiber

    // 这个写法 真妙！
    while (nextFiber) {

        // 看看这个父亲的节点有没有兄弟节点没访问的
        if (nextFiber.sibling) {
            return nextFiber.sibling
        }

        // 一层一层的返回父节点
        nextFiber = nextFiber.parent
    }
}
