/**
 *
 *  render 升级后运作流：
 *  1.  构建一个root fiber 作为梦想的起始点～
 *  2.  以 root fiber 为起点工作单元 开始工作
 *  3.  performUnitWork其实可以看作是调度生成下一个工作单元的任务
 *
 * */

let nextUnitOfWork = null;
let wipRoot = null; // working in progress root
let currentRoot = null; // render 之前，当前页面所对应的 fiber root
let deletions = null; // the nodes need to be removed.

function createDom(fiber) {
    const dom =
        fiber.type === "TEXT_ELEMENT"
            ? document.createTextNode(fiber)
            : document.createElement(fiber.type);
    const isProperty = key => key !== "children";
    Object.keys(fiber.props)
        .filter(isProperty)
        .forEach(name => {
            dom[name] = fiber.props[name];
        })
    return dom;
}


/**
 *  render 其实做的事情并不多，根据vDOm生成的一个 root fiber 节点
 *  这个 root fiber 是 react梦的起点～
 * */
export default function render(vDom, container) {

    // working in progress root
    wipRoot = {
        dom: container,
        props: {
            children: [vDom],
        },
        alternate: currentRoot // 指向当前页面中的相对应的 Fiber root节点
    }
    deletions = [];
    nextUnitOfWork = wipRoot;
    window.requestIdleCallback(workLoop);
}


/**
 *  快乐循环工作流
 *  工作 ---> 是否应该放弃 ---> 工作 ----> 是否应该放弃 。。。。
 */

function workLoop(deadline) {
    let hasRunOutOfTime = false; // 检查这一次循环是否还有充足的时间
    while (nextUnitOfWork && !hasRunOutOfTime) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        hasRunOutOfTime = deadline.timeRemaining() < 1;
    }
    if (!nextUnitOfWork && wipRoot) {
        commitRoot();
    }
    if (nextUnitOfWork) {
        window.requestIdleCallback(workLoop);
    }
}


/**
 *  每一个工作单元的做的事情, 任务不多
 *  相当仅仅是 创建儿子fiber，且建立起他们的父子 兄弟关系
 * */


function performUnitOfWork(fiber) {
    const isFunctionComponent = fiber.type instanceof Function
    if (isFunctionComponent){
        const childrenVDomList = [fiber.type(fiber.props)];
        reconcileChildren(fiber, childrenVDomList);
    } else {
        if (!fiber.dom) {
            fiber.dom = createDom(fiber);
        }
        const childrenVDomList = fiber.props.children;
        reconcileChildren(fiber, childrenVDomList);
    }
    // 1. 添加dom (可能回造成局部的UI更新, 所以这个步骤被删除)
    // if (fiber.parent) {
    //     fiber.parent.dom.appendChild(fiber.dom);
    // }


    // 2. 生成儿子们的fiber 并且完成 "father ---> first son ---> sibling --->" .... 的关系建立



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

/**
 *  wipFiber: 当前的工作单元的fiber 节点
 *  childrenVDomList：该fiber节点的 孩子的虚拟dom
 *
 *  在wipFiber中的alternate（之前的老的fiber节点），存在一条如下的单向链表：
 *       wipFiber.child --> sibling --> sibling ---> sibling ---> wipFiber
 *
 *  childrenVDOMList:
 *       [child1, child2, child2, child3]
 *
 *  以上单项连标和数组需要同时遍历
 *
 * */
function reconcileChildren(wipFiber, childrenVDomList) {
    let prevSibling = null; // 记录前面的兄弟节点

    let oldFiber = wipFiber.alternate && wipFiber.alternate.children; // 第一个孩子的vDOM 对应的 之前的 上一次渲染的Fiber

    for (let i=0; i<childrenVDomList.length; i++) {
        let childVDOM = childrenVDomList[i]; // 当前孩子vDOM
        let newFiber = null;
        const sameType = oldFiber && childVDOM.type === oldFiber.type;
        // 一样的类型
        if (sameType) {
            newFiber = {
                type: oldFiber.type,
                props: childVDOM.props,
                dom: oldFiber.dom,
                parent: wipFiber,
                alternate: oldFiber,
                effectTag: "UPDATE",
            }
        // 不一样的类型 或者 这是一个新的节点
        } else {
            newFiber = {
                type: childVDOM.type,
                props: childVDOM.props,
                dom: null,
                parent: wipFiber,
                alternate: null,
                effectTag: "PLACEMENT",
            }
        }
        // 移动向下一个单项链表
        if (oldFiber) {
            oldFiber = oldFiber.sibling;
        }
        // 建立父子关系
        if (i===0) {
            wipFiber.child = newFiber;
        }
        // 建立兄弟关系
        if (prevSibling) {
            prevSibling.sibling = newFiber;
        } else {
            prevSibling = newFiber;
        }
    }
    while (oldFiber) {
        oldFiber.effectTag = "DELETION";
        deletions.push(oldFiber);
        oldFiber = oldFiber.sibling;
    }
}

function commitRoot() {
    deletions.forEach(commitWork);
    console.log(wipRoot);

    commitWork(wipRoot.child);
    currentRoot = wipRoot;
    wipRoot = null;
}

function commitWork(fiber) {
    if (!fiber) {
        return;
    }
    let domParentFiber = fiber.parent
    while (!domParentFiber.dom) {
        domParentFiber = domParentFiber.parent
    }
    const domParent = domParentFiber.dom;

    if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
        domParent.appendChild(fiber.dom);
    } else if (fiber.effectTag === "DELETION") {
        commitDeletion(fiber, domParent);
    } else if (fiber.effectTag === "UPDATE") {
        updateDom(
            fiber.dom,
            fiber.alternate.props,
            fiber.props,
        )
    }
    commitWork(fiber.child);
    commitWork(fiber.sibling);
}

function commitDeletion(fiber, domParent) {
    if (fiber.dom) {
        domParent.removeChild(fiber.dom)
    } else {
        commitDeletion(fiber.child, domParent)
    }
}


const isNew = (prev, next) => key => prev[key] !== next[key] // 是新加入的
const isGone = (prev, next) => key => !(key in next) // 是被删除的
const isEvent = key => key.startsWith("on") // 事件监听属性
const isProperty = key => key !== "children" && !isEvent(key) //我们想要处理的props

function updateDom(dom, prevProps, nextProps) {
    // 删除以前的或者修改过的事件监听
    Object.keys(prevProps)
        .filter(isEvent)
        .filter(
            key =>
                !(key in nextProps) ||
                isNew(prevProps, nextProps)(key)
        )
        .forEach(name => {
            const eventType = name
                .toLowerCase()
                .substring(2)
            dom.removeEventListener(
                eventType,
                prevProps[name]
            )
        })

    // 删除老的属性
    Object.keys(prevProps)
        .filter(isProperty)
        .filter(isGone(prevProps, nextProps))
        .forEach(name => {
            dom[name] = ""
        })

    // 添加新的 或者修改过的属性
    Object.keys(nextProps)
        .filter(isProperty)
        .filter(isNew(prevProps, nextProps))
        .forEach(name => {
            dom[name] = nextProps[name]
        })

    // 添加新的事件
    Object.keys(nextProps)
        .filter(isEvent)
        .filter(isNew(prevProps, nextProps))
        .forEach(name => {
            const eventType = name
                .toLowerCase()
                .substring(2)
            dom.addEventListener(
                eventType,
                nextProps[name]
            )
        })
}
