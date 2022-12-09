import * as $ from 'jquery'
import * as d3 from 'd3'
import { Observable } from './Observable';
import { Util } from "./Util";

// ----------------------------- eventObserver -------------------------------
const eventObserver = {
    'selectAnnotation': new Observable(),
    'unSelectAnnotation': new Observable(),
    'dragAnnotStart': new Observable(),
    'dragAnnotEnd': new Observable(),
    'newTextBox': new Observable(),
    'deleteMarker': new Observable(),
    'saveAnnotCb': new Observable(),
    'applyAnnot': new Observable()
};

// ----------------------------- checkMouseDown -------------------------------
let mousedown: boolean = false;

document.addEventListener('mousedown', () => {
    mousedown = true;
});
document.addEventListener('mouseup', () => {
    mousedown = false;
});
// ------------------------------- mode properties ------------------------------

let isDrawingMode: boolean = false;
let isDrawingFillShape: boolean = false;
let isAnnotationMode: boolean = false;

// ------------------------------- indexing --------------------------------------
let rectIdx = 0;
let markerId = 0; 
const VIEWBOX_RANGE = 5;

// ------------------------------- layer elements --------------------------------
const annotationLayer = document.getElementById("annotation-layer");
const markerLayer = document.getElementById("marker-layer");
const svgElms = markerLayer.getElementsByClassName("tmp-marker-svg");
const svgElm = svgElms[0] as SVGSVGElement;
let svgElmSelection = d3.select(svgElm);
let newSvg: d3.Selection<SVGElement, unknown, HTMLElement, any> = null;


let markerLayerSelection = d3.select(markerLayer);
let annotLayerSelection = d3.select(annotationLayer);

// -------------------------------- button events -------------------------------
let annotationToggleBtn = document.getElementById("annotation-toggle")
let textboxToggleBtn = document.getElementById("annotation-textbox-btn");

d3.select(annotationToggleBtn).on('click', function() {
    if (isAnnotationMode) {
       outAnnotMode();
    } else {
       gotoAnnotMode();
    }
})

d3.select(textboxToggleBtn).on('click', function(){
    if (!isAnnotationMode) {
        return;
    }
    if (isDrawingMode) {
        outDrawingMode();
    } else {
        gotoDrawingMode();
    }
})

function gotoAnnotMode() {
    annotationToggleBtn.innerText = "annotation off";
    isAnnotationMode = true;
    markerEventBind(svgElmSelection);
    d3.select(textboxToggleBtn).style('disabled','false');
    // const textboxes: d3.Selection<SVGSVGElement,unknown,HTMLElement,any> = d3.selectAll('textbox');
    // textboxes.on('click', function() {
    //     markerActiveEvent(textboxes ,this);
    // })
    // annotation 모드로 갈 시 selectmode가 defualt
    const markerScaleElms = Array.prototype.slice.call(document.getElementsByClassName('annotation-layer'));
    for(const markerScaleElm of markerScaleElms) {
        const el = markerScaleElm as HTMLElement;
        if(el && el.classList) {
            el.classList.add('annotation-layer--pointer');
        }
    }
    //gotoDrawingMode는 각각의 버튼에서 
}

function outAnnotMode() {
    annotationToggleBtn.innerText = "annotation on"
    isAnnotationMode = false;
    markerEventClear(svgElmSelection);
    d3.select(textboxToggleBtn).style('disabled','true');
    // const textboxes: d3.Selection<SVGSVGElement,unknown,HTMLElement,any> = d3.selectAll('textbox');
    // textboxes.on('click', null); 

    const markerScaleElms = Array.prototype.slice.call(document.getElementsByClassName('annotation-layer'));
    for(const markerScaleElm of markerScaleElms) {
        const el = markerScaleElm as HTMLElement;
        if(el && el.classList) {
            el.classList.remove('annotation-layer--pointer');
        }
    }
    outDrawingMode();
}

function gotoDrawingMode() {
    $('.marker-layer').css('z-index','17');
    svgElmSelection.on('mousedown', function() {
        markerStart(svgElmSelection, this);
    })
    isDrawingMode = true;
}

function outDrawingMode() {
    $('.marker-layer').css('z-index','');
    svgElmSelection.on('mousedown', null);
    isDrawingMode = false;
}

// -----------------------------Drawing.ts-----------------------------------
// -----------------------------marker events--------------------------------
const getAnnotArea = (): {left: ()=>number, right: ()=>number, top: ()=>number, bottom: ()=>number} => {
    const left = () => {return 0};
    const top = () => {return 0};
    const bottom = () => {return 1500};
    const right = () => {return 1500};
    return {
        left: left,
        right: right,
        top: top,
        bottom: bottom
    };
};

export const annotPos = (w: number, h: number, l: number, t: number, lL: number, lR: number, lT: number, lB: number):
	{
		getLeft: ()=>number,
		getTop: ()=>number,
		setPos: (transX:number, transY:number)=>void,
		getMoveX: ()=>number,
		getMoveY: ()=>number,
		isMove: ()=>boolean
	} => {
	const width = w;
	const height = h;
	const limitLeft = lL;
	const limitRight = lR - width;
	const limitTop = lT;
	const limitBottom = lB - height;
	const firstLeft = l;
	const firstTop = t;
	let left = l;
	let top = t;
	const getLeft = () => {
		return Util.rangeVal(left, limitLeft, limitRight);
	};
	const getTop = () => {
		return Util.rangeVal(top, limitTop, limitBottom);
	};
	const getMoveX = () => {return firstLeft - getLeft();}
	const getMoveY = () => {return firstTop - getTop();}
	return {
		getLeft: getLeft,
		getTop: getTop,
		setPos: (transX: number, transY: number) => {
			left -= transX;
			top -= transY;
		},
		getMoveX: getMoveX,
		getMoveY: getMoveY,
		isMove: () => {
			return (Math.abs(getMoveX()) > 5 || Math.abs(getMoveY()) > 5 );
		}
	};
}

// function markerDragEventBind(svgSelection: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>, svgElement: SVGSVGElement): void {
//     let transX = 0, transY = 0, startX = 0, startY = 0;

//     // annot area => svg viewbox?
//     // annot pos => ?

//     const {left, right, top, bottom} = getAnnotArea();
//     let markPos = annotPos(parseFloat(annotInfo.w), parseFloat(annotInfo.h), parseFloat(annotInfo.l), 
//                             parseFloat(annotInfo.t), left(), right(), top(), bottom());
//     svgSelection.call(d3.drag()
//                     .on("start", () => {
//                         startX = d3.event.x;
//                         startY = d3.event.y;
//                         markPos = annotPos(parseFloat(annotInfo.w), parseFloat(annotInfo.h), parseFloat(annotInfo.l), 
//                                             parseFloat(annotInfo.t), left(), right()/ratio(), top(), bottom()/ratio());
//                     })
//                     .on("drag", () => {
//                         transX = startX - d3.event.x;
//                         transY = startY - d3.event.y;
//                         startX = d3.event.x;
//                         startY = d3.event.y;
//                         markPos.setPos((transX), (transY));
//                         // 실제로 움직이는 것은 viewbox이기 때문에 마커와 viewbox와의 거리만큼 빼야함.
//                         transX && svgSelection.style("left", (markPos.getLeft()-VIEWBOX_RANGE) + 'px');
//                         transY && svgSelection.style("top", (markPos.getTop()-VIEWBOX_RANGE) + 'px');
//                     })
//                     .on("end", () => {
//                         if(markPos.isMove()) {
//                             const attr = {
//                                 'left' : markPos.getLeft().toFixed(2),
//                                 'top' : markPos.getTop().toFixed(2),
//                                 'path' : this.getDrawingTool(getAnnotType(annotInfo)).moveMarker(annotInfo, markPos.getMoveX(), markPos.getMoveY()),
//                             };
//                             // 마커 이동 업데이트
//                         }
//                         eventObserver.dragAnnotEnd.notify({page: pageOrSheetIdx, annotId: annotId, showPopup: true, ratio: ratio()});
//                     })
//             );
// }

function parseMarkerId(id: string): Number {
    if(!id) {
        return;
    }
    const splitedArr: Array<string> = id.split("-");
    return Number(splitedArr[1]);
}

let activeMarker = null;

// 선택된 마커 활성화 이벤트 - targetEL을 HTMLDivElement로도 받고있으므로 문제가 없다.
// 내부에 조건문으로 텍스트박스 div에 마커 활성화 이벤트르 적용 시키기 
function markerActiveEvent(svgSelection: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>, targetEL: HTMLDivElement | SVGSVGElement): void {
    activeMarker = targetEL;
    svgSelection.classed('active', true)
    svgSelection.on('mouseover', function() {this.style.cursor='move'});
    // if (isAnnotationMode) {
    //     markerDragEventBind(svgSelection, targetEL);
    // }
}

function markerInactiveEvent(): void {
    if(!activeMarker) {
        return;
    }  
    const svgSelection = d3.select(activeMarker);
    svgSelection.classed('active', false);
    svgSelection.on('.drag', null);
    svgSelection.on('mouseover', function() {
        this.style.cursor = 'pointer';
    })
    activeMarker = null;
}




function markerEventClear(svgSelection: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>): void {
    svgSelection.on('mousedown', null);
    svgSelection.on('mouseup', null);
    svgSelection.on('click', null);
    svgSelection.on('mouseover', null);
}

function markerEventBind(svgSelection: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>): void {
    svgSelection.on('mousedown', function() {
        isDrawingFillShape = true;
        isDrawingFillShape && markerStart(svgSelection, this)
    });
    svgSelection.on('mouseup', function() {
        markerEnd(svgSelection, this)
        isDrawingFillShape = false;
    });
}

function markerDrawBind(svgSelection: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>,
    markerEnd: (svgSelection: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>, svgElement: SVGSVGElement) => void,
    markerDrawTmp: () => void): void {
    if (d3.event.type === 'mousedown') {
        svgSelection.on('mousemove', function () { markerDrawTmp() });
    } else if (d3.event.type === 'pointerdown') {
        svgSelection.on('pointermove', function () { markerDrawTmp() });
    } else {
        svgSelection.on('touchmove', function () {
            d3.event.preventDefault();
            const svgWidth = parseFloat(svgSelection.node().style.width);
            const svgHeight = parseFloat(svgSelection.node().style.height);
            const touch = d3.touches(this)[0];
            if (touch[0] < 0 || touch[0] > svgWidth || touch[1] < 0 || touch[1] > svgHeight) {
                markerEnd(svgSelection, this);
                return;
            }
            markerDrawTmp();
        });
    }
}

// tmp-svg-marker에 그린 svg를 anntotation 레이어에 옮긴다.
// div textbox 영역을 생성 하위에 rect를 담는 svg요소와 textarea요소를 배치한다.

function addTextboxElmToAnnotLayer() {
    const curRect = document.getElementById(`rect-${rectIdx}`);
    const width = curRect.getAttribute("width");
    const height = curRect.getAttribute("height");
    const left = curRect.getAttribute("x");
    const top = curRect.getAttribute("y");

    const textboxDiv = document.createElement('div');
    d3.select(textboxDiv)
    .attr('id', `textbox-${rectIdx}`)
    .attr('class', 'textbox')
    .style('position', 'absolute')
    .style('left', `${left}px`)
    .style('top', `${top}px`);

    const svg = d3.select(textboxDiv).append('svg')
        .attr('id', `${markerId}`)
        .attr('class', `marker-svg`)
        .attr('viewBox', `${left} ${top} ${width} ${height}`)
        .style('width', `${width}`)
        .style('height', `${height}`)
        .attr('focusable', 'false');
    
    svg.append('rect')
    .style('stroke', 'red')
    .style('stroke-width', '10')
    .style('opacity', 0.5)
    .style('fill', 'transparent')
    .attr('id', `rect-${rectIdx}`)
    .attr('x', `${left}`)
    .attr('y', `${top}`)
    .attr('width', `${width}`)
    .attr('height', `${height}`)
    .style('z-index', '18');

    const textarea = document.createElement('textarea');
    d3.select(textarea)
    .attr('class', 'annotation-textbox__content')
    .style('position', 'absolute')
    .style('width', `${parseInt(width) - 5}px`)
    .style('height', `${parseInt(height) - 5}px`)
    .style('background', 'none')
    .style('resize', `none`)
    .style('border','none')
    .style('overflow', 'hidden')
    .style('outline', 'none')
    .attr('autofocus', 'true');
    
    textboxDiv.appendChild(textarea);
    annotationLayer.appendChild(textboxDiv);
}

function markerEnd(svgSelection: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>, svgElement: SVGSVGElement): void {
    svgSelection.on('mousemove', null);
    isDrawingFillShape = false;
    addTextboxElmToAnnotLayer();
    outDrawingMode();
    rectIdx++;
}

function markerStart(svgSelection: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>, svgElement: SVGSVGElement): void {
    // 다중 터치하여 그리는 것을 방지
    const _event: TouchEvent = event as TouchEvent;
    if(!!_event.touches && _event.touches.length > 1) {
        return;
    }
    // const svgSelectionId = Util.getParentElement(svgSelection.node()).id;
    // const pageOrSheetIdx = Util.getIdxFromElmId(svgSelectionId, 'marker-section');
    
    const m = d3.mouse(svgElement);
    newSvg = svgSelection.append('rect')
    .style('stroke', 'red')
    .style('stroke-width', '3')
    .style('opacity', 1)
    .style('fill', 'transparent')
    .attr('id', `rect-${rectIdx}`)
    .attr('x', m[0])
    .attr('y', m[1])
    .style('position', 'absolute')
    .style('z-index', '18');

    markerDrawBind(svgSelection, markerEnd, () => {markerDrawTmp(svgElement, m[0], m[1])});
}

function markerDrawTmp(svgElement: SVGSVGElement, x: number, y: number): void {
    const m = d3.mouse(svgElement);
    const width = Math.max(0, Math.abs(m[0]-x));
    const height = Math.max(0, Math.abs(m[1]-y));
    if(m[0]-x >= 0 && m[1]-y >= 0) { // 좌상단 -> 우하단
        newSvg.attr('width', width).attr('height', height);
    } else if(m[0]-x >= 0 && m[1]-y < 0) { // 좌하단 -> 우상단
        newSvg.attr('y', m[1]).attr('width', width).attr('height', height);
    } else if(m[0]-x < 0 && m[1]-y >= 0) { // 우상단 -> 좌하단
        newSvg.attr('x', m[0]).attr('width', width).attr('height', height);
    } else if(m[0]-x < 0 && m[1]-y < 0){ // 우히딘 -> 좌상단
        newSvg.attr('x', m[0]).attr('y', m[1]).attr('width', width).attr('height', height);
    }
}

console.log(d3.select("annotaion-toggle"));