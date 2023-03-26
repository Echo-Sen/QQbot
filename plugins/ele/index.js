const { PupPlugin, axios, http } = require('@pupbot/core')
/* 
uid:QQ账号
ubuild:楼栋号
uroom:宿舍号
surplus:剩余电费
update_time:更新时间
current_usage:当月用量
*/
config = [
    { uid: '', uroom: '', ubuild: '', surplus: '', update_time: '', current_usage: '' }
]
const AdminCmds = [
    '/ele list (当前账号绑定信息)\n',
    '/ele bind 南区1舍-106(绑定房间信息)\n',
    '/ele find (查询电费信息)',
]
const plugin = new PupPlugin('ele', '1.0.0')
plugin.onMounted((bot) => {
    config = plugin.loadConfig()
    plugin.onCmd('/ele', async (event, params) => {
        let objectLength = Object.keys(config).length
        const [cmd, value] = params
        // 设置引导帮助
        if (cmd == undefined) {
            // 帮助消息
            event.reply(AdminCmds)
        }
 // 重新匹配方式
        if (cmd === 'a') {

           
        //     let numberPattern1 = /[一二三四五六七八九十]|(?<=-)\d+/g;  // 定义一个匹配汉字和数字的正则表达式

        //     let matches1 = roomName.match(numberPattern1);  // 使用 match() 方法获取所有匹配的内容
        //     plugin.log(matches1)
        //     let numberPattern = /\d+/g;  // 定义一个匹配数字的正则表达式
        //     let matches = roomName.match(numberPattern);  // 使用 match() 方法获取所有匹配的数字
        //     plugin.log(matches)

        }
        // 绑定房间号
        if (cmd === 'bind') {
           
            let req = value.split("-")
            // qq账号
            uid = event.sender.user_id;
            // 楼栋号
            dyid = req[0];
            //  房间号
            pid = req[1];
            // 通过QQ账号判断是否唯一
            let flag = 0
            for (let i = 0; i < objectLength; i++) {
                if (config[i].uid === event.sender.user_id) {
                    // 重新设置其对应的值
                    config[i] = { uid: uid || '', uroom: pid || '', ubuild: dyid || '', surplus: '', update_time: '', current_usage: '' }
                    flag = -1
                }
            }
            if (flag !== -1) {
                const newConfig = { uid: uid, uroom: pid, ubuild: dyid, surplus: '', update_time: '', current_usage: '' }
                config.push(newConfig)
            }
            plugin.saveConfig(config)
            return event.reply("绑定成功", true)
        }

        // 查询电费
        if (cmd === 'find') {
            let flag = 0
            for (let i = 0; i < objectLength; i++) {
                if (config[i].uid === event.sender.user_id) {
                    flag = i
                }
            }
            if (flag) {
                try {
                    let pid = config[flag].uroom;
                    let dyid = config[flag].ubuild;
                    const Url = `https://hqpay.ctbu.edu.cn/weixin/ashx/frmuser.ashx?test=lastlist&pid=${pid}&dyid=${dyid}`
                    get = await axios.get(Url)
                    // 剩余电费
                    config[flag].surplus = get.data[0][1]
                    // 更新时间
                    config[flag].update_time = get.data[0][2]
                    // 当月用量
                    config[flag].current_usage = get.data[0][3]
                    plugin.saveConfig(config)
                    return event.reply(`宿舍号：${get.data[0][0]}\n剩余电费：${get.data[0][1]}\n更新时间：${get.data[0][2]}\n当月用电：${get.data[0][3]}`, false)
                } catch {
                    return event.reply("请检查绑定信息是否出错！！！\n格式为：/ele bind 南区1舍-106")
                }

            } else {
                return event.reply("请绑定房间号！！！\n例：/ele bind 南区1舍-106")
            }

        }

        // 账号绑定信息
        if (cmd === 'list') {
            let flag = 0
            for (let i = 0; i < objectLength; i++) {
                if (config[i].uid === event.sender.user_id) {
                    // 找到与该QQ号匹配的的对象信息
                    const suid = config[i].uid
                    const suroom = config[i].uroom
                    const subuild = config[i].ubuild
                    const ssurplus = config[i].surplus
                    const supdate_time = config[i].update_time
                    const scurrent_usage = config[i].current_usage
                    return event.reply(`QQ账号：${suid}\n宿舍号：${suroom}\n楼栋号：${subuild}\n剩余电费：${ssurplus}\n更新时间：${supdate_time}\n当月用电：${scurrent_usage}`, false)
                }
            }
            return event.reply('请先绑定！')

        }
        // 定时更新电费测试

        // if (cmd === 'test') {
        //     let data_json = {
        //         // 更新时间，默认为每天早上8点
        //         time: '0 0 8 * * *',
        //         userList: []
        //     }
        //     let message = `您当前宿舍电费剩余低于十元！请尽快充值！`
        //     for (let i = 0; i < config.length; i++) {
        //         if (config[i].uid) {
        //             let pid = config[i].uroom;
        //             let dyid = config[i].ubuild;
        //             const Url = `https://hqpay.ctbu.edu.cn/weixin/ashx/frmuser.ashx?test=lastlist&pid=${pid}&dyid=${dyid}`
        //             get = await axios.get(Url)
        //             if (get.data[0][1] <= 10) {
        //                 data_json.userList.push(config[i].uid)
        //             }
        //         }
        //     }
        //     data_json.userList.forEach(id => {
        //         bot.sendPrivateMsg(id, message)
        //     })
        // }
    })

    // 定时更新 提醒电费余额
    let data_json = {
        // 更新时间，默认为，每周1中午12点
        time: '0 12 * * 1',
        userList: []
    }
    const task = plugin.cron(data_json.time, async () => {
        try {
            data_json.userList = []
            for (let i = 0; i < config.length; i++) {
                if (config[i].uid) {
                    let pid = config[i].uroom;
                    let dyid = config[i].ubuild;
                    const Url = `https://hqpay.ctbu.edu.cn/weixin/ashx/frmuser.ashx?test=lastlist&pid=${pid}&dyid=${dyid}`
                    get = await axios.get(Url)
                    if (get.data[0][1] <= 10 && !data_json.userList.includes(get.data[0][1])) {
                        data_json.userList.push(config[i].uid)
                    }
                }
            }
        }
        catch { plugin.log('获取电费信息失败') }
        let message = `您当前宿舍电费剩余低于十元！请尽快充值！`
        data_json.userList.forEach(id => {
            bot.sendPrivateMsg(id, message)
            plugin.log(`发送消息给：${id}\n`)
        })
    })
    // task.stop() 停止提醒
})
module.exports = { plugin }
