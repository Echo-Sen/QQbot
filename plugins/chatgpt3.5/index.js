
const { PupPlugin,segment } = require('@pupbot/core')

// const { Configuration, OpenAIApi } = require('openai')

const axios = require('axios');

const crypto = require('crypto');
const { debuglog } = require('util');

const { name, version } = require('./package.json')

const plugin = new PupPlugin(name, version)

let config = {
  // 所有key
  keys: [],
  //当前使用的key
  key:'',
  //
  allfree:true,
  //免费用户列表
  FreeUsers:[
  ],
  //
  PayUsers:{
  },
  // appid:14654,
  // PayApiKey:"key",

  // 使用的模型，参考这里：https://platform.openai.com/docs/models/models
  model: 'gpt-3.5-turbo',
  // 触发命令前缀
  CmdPrefix: '%',
  // 超时时间（毫秒，默认三十秒）
  timeout: 70000,
  //温度（）
  temperature: 0.7,
  max_tokens: 1024,
  // 是否开启 at 触发
  enableAt: true,
  // 是否在群聊中开启（发言不可控，为了账号安全可以关闭群聊功能，仅保留私聊）
  enableGroup: false
}

const msgs = {
  needKey: `还没有apikey哦，请先添加apiKey，格式：/gpt addkey <apikey>，如果不通过/gpt setkey <apikey>设置当前使用的key，则随机从keys中选取`,
  KeyInvalid: 'apikey错误，请检查当前使用key',
  apiError: 'API 请求异常，可能是 apiKey 错误或请求太频繁,请检查当前使用apikey',
  emptyMessage: '这个 OpenAI 不知道哦！'
}

const AdminCmds = [
  '/gpt  getkey  (查看当前使用的key)',
  '/gpt  getkeys (查看所有key)',
  '/gpt  setkey  <设置当前使用key>',
  '/gpt  addkey  <添加key>',
  '/gpt  free    on/off(开启/关闭公益模式)',
  '/gpt  at      on/off(开启/关闭@触发)',
  '/gpt  group   on/off(开启/关闭群聊触发)',
  '/gpt  tout    <超时时间>',
  '/gpt  tp      <温度(精确度)0.0--2.0>',
  '/gpt  tks     <最大token数(正整数)>',
  '/gpt  prefix  <触发前缀>'
]
// 这是收费命令
const Cmds = [
  '/gpt  remain   (查看剩余次数)',
  '/gpt  charge    (充值次数 1元/70次)'
]

plugin.onMounted(async bot => {

  plugin.saveConfig(Object.assign(config, plugin.loadConfig()))

  if (!config.keys[0]) {
    bot.sendPrivateMsg(plugin.mainAdmin, msgs.needKey)
    plugin.log(msgs.needKey)
  }


  plugin.onAdminCmd('/gpt', (e, params) => {
    
    const [cmd, value] = params

    if(cmd === 'getkey'){
      if(!config.keys[0]) return bot.sendPrivateMsg(plugin.mainAdmin, msgs.needKey)
      return e.reply('当前使用的key为 ' + config.key)
    }

    if(cmd === 'getkeys'){
      if(!config.keys[0]) return bot.sendPrivateMsg(plugin.mainAdmin, msgs.needKey)
      return e.reply(`当前所有key：\n${config.keys.join('\n')}`)
    }

    if (cmd === 'setkey' && value) {
      config.keys.push(value)
      config.key = value
      plugin.saveConfig(config)

      return e.reply('当前apiKey设置完成', true)
    }
    if(cmd === 'addkey' && value)
    {
      config.keys.push(value)
      plugin.saveConfig(config)

      return e.reply(`添加成功!`)
    }

    // if(cmd === 'free' && ['on', 'off'].includes(value)){
    //   config.allfree = value === 'on'
    //   plugin.saveConfig(config)

    //   return e.reply(`已${config.allfree ? '开启' : '关闭'}公益模式🤣`)
    // }

    if (cmd === 'at' && ['on', 'off'].includes(value)) {
      config.enableAt = value === 'on'
      plugin.saveConfig(config)

      return e.reply(`已${config.enableAt ? '开启' : '关闭'} at 触发`, true)
    }

    if (cmd === 'group' && ['on', 'off'].includes(value)) {
      config.enableGroup = value === 'on'
      plugin.saveConfig(config)

      return e.reply(`已${config.enableGroup ? '开启' : '关闭'}群聊功能`, true)
    }

    //超时时间
    if(cmd === 'tout' && value)
    {
      if(/^([1-9]\d*(\.\d+)?|0?\.\d*[1-9]\d*)$/.test(value) && Number(value) >= 1)
      {
        config.timeout = value
        plugin.saveConfig(config)
        return e.reply(`已设置超时时间为: ${value} (设置时间过短可能会丢失回答)`)
      }
      return e.reply('设置失败！超时时间必须为大于等于1秒的数字')
      
    }

    //温度
    if(cmd === 'tp' && value){
      if(/^(0(\.\d+)?|1(\.0+)?|2(\.0+)?)$/.test(value)){
        config.temperature = value
        plugin.saveConfig(config)
        return e.reply('已修改温度为'+value)
      }
      return e.reply('设置失败！温度只能是0.0--2.0的数字')
    }

    //设置回答最大token数
    if(cmd === 'tks' && value)
    {
      if(/^[1-9]\d*$/.test(value)){
        config.max_tokens = value
        plugin.saveConfig(config)
        return e.reply('已修改max_tokens为'+value)
      }
      return e.reply('设置失败！max_tokens只能为正整数')
    }
    if (cmd === 'prefix' && value) {
      config.CmdPrefix = value
      plugin.saveConfig(config)

      return e.reply('已修改命令触发前缀为'+value, true)
    }
    if(!cmd)
      return e.reply(AdminCmds.join('\n'), true)
  })



  plugin.onCmd('/gpt',async (e,params) => {
    // if(config.FreeUsers.includes(e.sender.user_id)) return
    const [cmd, value] = params

    // if(cmd === 'remain'){
    //   if(!config.PayUsers[e.sender.user_id]){
    //     e.reply('这是你第一次使用chatgpt3.5，现赠送你17次使用次数。')
    //     config.PayUsers[e.sender.user_id] = 17
    //     plugin.saveConfig(config)
    //   }
    //   return e.reply(`您当前剩余次数为：${config.PayUsers[e.sender.user_id]}`)
    // }
    
    // if(cmd === 'charge'){
    //   let isPay = false

    //   const pay_type = value == 'alipay' ? 'alipay' : 'wechat'

    //   const order_no = Date.now().toString() + Math.random().toString().slice(2, 7)

    //   let signMD = {
    //     app_id:config.appid,
    //     order_no,
    //     trade_name:'ChatGPT',
    //     pay_type,
    //     order_amount:3.00,
    //     order_uid:e.sender.user_id,
    //     payer_name:e.sender.user_id
    //   }
    //   // console.log(signMD)

    //   let signNoMD5 =  Object.entries(signMD)
    //     .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    //     .join('&') + '&' +  config.PayApiKey
    //   // console.log(signNoMD5)

    //   let sign = crypto.createHash('md5').update(signNoMD5).digest('hex').toUpperCase()
    //   // console.log(sign)

    //   let queryObj = {...signMD,sign}
    //   // console.log(queryObj)

    //   let query = 'format=json&' + Object.entries(queryObj)
    //   .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    //   .join('&')
    //   console.log(query)

    //   const result = await axios({
    //     method: 'GET',
    //     url: 'https://api.sdpay.cc/pay?' + query
    //   })

    //   const {data} = result
    //   console.log(data)

    //   if(!data.status) return e.reply('二维码获取异常，请尝试切换支付方式再试')

    //   const {qr_img,no} = data 
    //   // console.log(qr_img)
    
    //   let img = segment.image(Buffer.from(qr_img.split(',')[1], 'base64'))

    //   if(pay_type == 'wechat')
    //   {
    //     e.reply(['请用微信扫码',img])
    //   }else{
    //     e.reply(['请用支付宝扫码',img])
    //   }


    //   //开始等待订单成功

    //   let ConfSignNo = {
    //     app_id:config.appid,
    //     order_no,
    //   }
    //   let ConfNoMD5 = Object.entries(ConfSignNo).map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    //     .join('&')+'&'+config.PayApiKey
    //   let ConfirmSign = crypto.createHash('md5').update(ConfNoMD5).digest('hex').toUpperCase()
    //   let ConfirmQuery = Object.entries({
    //     ...ConfSignNo,
    //     sign:ConfirmSign
    //   }).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&')

    //   const ConfParam = {
    //     method: 'GET',
    //     url: 'https://api.sdpay.cc/pay?'+ConfirmQuery,
    //   }


    //   async function Confirm() {
    //     try {
    //       const res = await axios(ConfParam)
    //       const data = res.data
    //       // console.log('订单查询pay：',ConfParam.url)
    //       if (data.status === 'success') {

    //         clearInterval(intervalId); // 如果收到成功响应，停止发送请求

    //         let res = await axios({
    //           method:'POST',
    //           usl:'http://47.115.227.77:7373/openai/confirmpay',
    //           data: {
    //             no
    //           }
    //         }).data
    //         let pay = 0.00
    //         console.log('confirm: ',res)
    //         if(res.status == 1){
    //           pay = res.pay
    //           isPay = true

    //           //根据付费金额增加用户次数

    //           config.PayUsers[e.sender.user_id] += pay / 0.02

    //         }else return
            
    //         e.reply('充值成功！您当前剩余次数为：'+config.PayUsers[e.sender.user_id])
    //       }
    //     } catch (error) {

    //       console.error(error)
    //       plugin.logger.error(error)

    //     }
    //   }

    //   //设置超时时间
    //   const totalTime = 2 * 60 * 1000
    //   //发送请求间隔时间
    //   const intervalTime = 3000
    //   // 发送请求的次数和已经发送请求的时间
    //   let requestCount = 0;

    //   let elapsedTime = 0;
    //   const intervalId = setInterval(() => {
    //     if (elapsedTime >= totalTime) {
    //       clearInterval(intervalId); // 达到总时间后停止发送请求

    //       e.reply('订单已超时(5分钟)，未检测到已支付，请重新/gpt charge付款')
    //       isPay = false
    //     } else {
    //       Confirm();
    //       requestCount++;
    //       elapsedTime = requestCount * intervalTime;
    //     }
    //   }, intervalTime);

    // }


    if(!cmd)
      return e.reply(Cmds.join('\n'), true)
  })

  /* let configuration = new Configuration({ apiKey: config.apiKey })
  let openai = new OpenAIApi(configuration) */


  plugin.onMessage(async event => {
    const { message , message_type } = event
    const text = message
      .filter(e => e.type === 'text')
      .map(e => e.text)
      .join('')
    
    // 配置关闭群聊时，过滤群聊信息
    if (!config.enableGroup && message_type !== 'private') return
    

    // 消息符合命令前缀
    const isCmd = text.startsWith(config.CmdPrefix)
    // Bot 被艾特
    const isAt = message.some(e => e.type === 'at' && e.qq === bot.uin)

    // 触发条件（符合命令前缀 或者 在启用艾特触发时，Bot 被艾特）
    const isHit = isCmd || (config.enableAt && isAt)

    // 过滤不触发的消息
    if (!isHit) return

    

    console.log(config);
    if (!config.keys[0]) {
      return bot.sendPrivateMsg(plugin.mainAdmin, msgs.needKey)
    }
    

    // trytrytrytrytrytryrty
    try {

      let payid = ''
      let {PayUsers} = config 
      //判断
      if(!config.allfree && !config.FreeUsers.includes(event.sender.user_id)){
        payid = event.sender.user_id
      }
      // if(payid && !PayUsers[payid]){
      //   if(PayUsers[payid] === 0) return event.reply('您的次数已耗尽，请充值后使用(/gpt charge)')
      //   event.reply('这是你第一次使用chatgpt3.5，现赠送你17次使用次数。')
      //   PayUsers[payid] = 17
      //   plugin.saveConfig(config)
      // }
      
      event.reply('ChatGPT思考中...请稍等...')
      const content = text.replace(config.CmdPrefix, '').trim()

      // console.log(content, config)

      const ChatConfig = {

        messages: [{role:"user",content}],
        max_tokens: config.max_tokens,
        temperature: config.temperature,

      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, config.timeout);

      const options = {
        method: 'POST',
        url: 'http://127.0.0.1:7373/openai/completions',
        data: {ChatConfig,key:config.key ?? config.keys[Math.floor(Math.random() * config.keys.length)]},
        timeout: config.timeout,
        timeoutSignal: controller.signal
      };
      

      const completion = await axios(options)
        .then(res => {
          console.log(res?.data ?? res)
          clearTimeout(timeoutId)
          return res?.data?.error ?? res?.data ?? res
        })
        .catch(err => {
          if (axios.isCancel(err.data)) {

            plugin.logger.error(err)
            console.error('请求超时');
            
          } else {
            // console.error("error: "+err);
            plugin.logger.error(err)
            return {
              errormsg: 'error : 代理服务器未响应'
            }
          }
        });

      /* const { data } = await openai.createChatCompletion(
        {
          model: config.model,
          temperature: config.temperature,
          max_tokens: config.max_tokens,
          messages: [{ role: 'user', content: question }]
        },
        {
          // 超时
          timeout: config.timeout
        }
      ) */


      console.log("completion:\n",completion)

      //错误响应处理
      if(completion?.errormsg)
          return event.reply(completion.errormsg,true)

      if(completion?.code == 'invalid_api_key'){
        event.reply(msgs.KeyInvalid+"\n错误信息:"+ completion.message,true)
        return plugin.logger.error(completion)
      }

      //正确响应处理
      const res = completion?.choices?.[0].message.content.trim() ?? ''

      // console.log('res:'+res)

      //计算剩余次数
      if(payid) {
        PayUsers[payid]--
        plugin.saveConfig(config)
      }
      
      
      return event.reply(res ?? msgs.emptyMessage, true)

    } catch (err) {

      plugin.logger.error(err?.message ?? err)

      return event.reply(err?.message ?? msgs.apiError, true)
    }
  })
})



module.exports = { plugin }
