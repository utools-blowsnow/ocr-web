export default {
    inserted(el, binding, vnode, oldVnode) {
        // 获取app.vue根节点下的 ref为tooltip的el-tooltip组件
        const tooltip = vnode.context.$root._vnode.child.$refs.tooltip
        const content = binding.value;
        const placement = binding.modifiers.placement || 'bottom';

        // 给添加指令的el对象添加鼠标移入事件
        el.__vueTooltipMouseenter__ = function() {
            // 获取对象默认的title / placeholder
            console.log(binding, content , el, el.innerText , el.textContent);
            // 获取content值，如果没有则取innerText 或 textContent
            tooltip.$parent.$data.tooltipContent = content || el.innerText || el.textContent;
            tooltip.$parent.$data.tooltipPlacement = placement;
            // 关联el
            tooltip.referenceElm = el;
            // 隐藏之前打开的popper
            tooltip.$refs.popper && (tooltip.$refs.popper.style.display = 'none');
            tooltip.doDestroy();
            tooltip.setExpectedState(true);
            tooltip.handleShowPopper();
        }
        // 给添加指令的el对象添加鼠标移入事件
        el.__vueTooltipMouseleave__ = function() {
            tooltip.setExpectedState(false);
            tooltip.handleClosePopper();
        }
        // 绑定事件
        el.addEventListener('mouseenter', el.__vueTooltipMouseenter__);
        el.addEventListener('mouseleave', el.__vueTooltipMouseleave__);
    },
    unbind(el, binding, vnode, oldVnode) {
        el.removeEventListener('mouseenter', el.__vueTooltipMouseenter__);
        el.removeEventListener('mouseleave', el.__vueTooltipMouseleave__);
        delete el.__vueTooltipMouseenter__;
        delete el.__vueTooltipMouseleave__;
    },
    update: function () {},
    componentUpdated: function () {}
}
