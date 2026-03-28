import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        redirect: '/tree'
    },
    {
        path: '/tree',
        name: 'Tree',
        component: () => import('../views/TreeView.vue')
    },
    {
        path: '/uart',
        name: 'UART',
        component: () => import('../views/UartView.vue')
    },
    {
        path: '/i2c',
        name: 'I2C',
        component: () => import('../views/I2cView.vue')
    },
    {
        path: '/can',
        name: 'CAN',
        component: () => import('../views/CanView.vue')
    },
    {
        path: '/ethernet',
        name: 'Ethernet',
        component: () => import('../views/EthernetView.vue')
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router