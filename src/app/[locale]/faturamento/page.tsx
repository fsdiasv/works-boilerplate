import { Calendar, CreditCard, Download, Edit, Info, RefreshCw, Shield, Star } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function FaturamentoPage() {
  return (
    <>
      <div className='mb-6'>
        <h1 className='text-sw-text-primary mb-1 text-3xl font-bold'>Faturamento</h1>
        <p className='text-sw-text-tertiary'>
          Gerencie seu plano, cartão de crédito e acompanhe o histórico de pagamentos da sua conta
          Works-Boilerplate.
        </p>
      </div>

      <div className='mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <Card className='sw-card'>
          <CardHeader className='flex flex-row items-center justify-between pb-4'>
            <CardTitle className='text-sw-text-primary text-lg font-semibold'>
              Cartão de Pagamento
            </CardTitle>
            <Button className='sw-button-primary h-auto px-3 py-1.5 text-sm'>
              <Edit className='mr-2 h-4 w-4' />
              Trocar Cartão
            </Button>
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-4'>
              <div className='bg-sw-accent-purple flex h-8 w-12 items-center justify-center rounded-md'>
                <CreditCard className='text-primary-foreground h-6 w-6' />
              </div>
              <div>
                <div className='text-sw-text-primary font-medium'>Mastercard •••• 9247</div>
                <div className='text-sw-text-tertiary text-sm'>Vencimento: 09/27</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='sw-card'>
          <CardHeader className='flex flex-row items-center justify-between pb-4'>
            <CardTitle className='text-sw-text-primary text-lg font-semibold'>Seu Plano</CardTitle>
            <Badge className='bg-sw-accent-purple text-primary-foreground px-2 py-0.5 text-xs'>
              Ativo
            </Badge>
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-4'>
              <div className='bg-sw-accent-purple flex h-12 w-12 items-center justify-center rounded-lg'>
                <Star className='text-primary-foreground h-6 w-6' />
              </div>
              <div>
                <div className='text-sw-text-primary font-medium'>Plano Profissional</div>
                <div className='text-sw-text-tertiary text-sm'>R$97,00 por mês</div>
                <div className='text-sw-text-tertiary text-sm'>
                  7 posts/dia ilimitados, agendamento & suporte premium
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {[
          { label: 'Próxima cobrança', value: 'R$97,00', sub: '/ mês', isCurrency: true },
          { label: 'Agendada para', value: '10 Jun 2024' },
          {
            label: 'Status',
            value: 'Assinatura ativa',
            isStatus: true,
            statusColor: 'text-sw-accent-green',
          },
          { label: 'Renovação', value: '10 Jun 2024' },
        ].map(item => (
          <Card key={item.label} className='sw-card p-4'>
            <div className='text-sw-text-tertiary mb-1 text-xs'>{item.label}</div>
            {item.isStatus === true ? (
              <div className='flex items-center gap-2'>
                <div className='bg-sw-accent-green h-2 w-2 rounded-full'></div>
                <span className={`font-medium ${item.statusColor}`}>{item.value}</span>
              </div>
            ) : (
              <div
                className={`font-medium ${item.isCurrency === true ? 'text-sw-accent-purple' : 'text-sw-text-primary'}`}
              >
                {item.value}{' '}
                {item.sub != null && (
                  <span className='text-sw-text-tertiary text-xs'>{item.sub}</span>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      <Card className='sw-card mb-6'>
        <CardHeader className='pb-4'>
          <CardTitle className='text-sw-text-primary text-lg font-semibold'>
            Histórico de Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-border border-b'>
                  <th className='text-sw-text-tertiary px-4 py-3 text-left font-medium tracking-wider uppercase'>
                    DATA
                  </th>
                  <th className='text-sw-text-tertiary px-4 py-3 text-left font-medium tracking-wider uppercase'>
                    VALOR
                  </th>
                  <th className='text-sw-text-tertiary px-4 py-3 text-left font-medium tracking-wider uppercase'>
                    MÉTODO
                  </th>
                  <th className='text-sw-text-tertiary px-4 py-3 text-left font-medium tracking-wider uppercase'>
                    STATUS
                  </th>
                  <th className='text-sw-text-tertiary px-4 py-3 text-left font-medium tracking-wider uppercase'>
                    RECIBO
                  </th>
                </tr>
              </thead>
              <tbody className='divide-border divide-y'>
                {[
                  { date: '10 Mai 2024', value: 'R$97,00' },
                  { date: '10 Abr 2024', value: 'R$97,00' },
                  { date: '10 Mar 2024', value: 'R$97,00' },
                  { date: '10 Fev 2024', value: 'R$97,00' },
                ].map((payment, index) => (
                  <tr key={index}>
                    <td className='text-sw-text-secondary px-4 py-3'>{payment.date}</td>
                    <td className='text-sw-accent-purple px-4 py-3 font-medium'>{payment.value}</td>
                    <td className='text-sw-text-secondary px-4 py-3'>
                      <div className='flex items-center gap-2'>
                        <CreditCard className='text-sw-text-tertiary h-4 w-4' />
                        <span>Mastercard •••• 9247</span>
                      </div>
                    </td>
                    <td className='px-4 py-3'>
                      <Badge
                        variant='outline'
                        className='text-sw-accent-green border-sw-accent-green/30 bg-sw-badge-green-background px-2 py-0.5 text-xs'
                      >
                        Pago
                      </Badge>
                    </td>
                    <td className='px-4 py-3'>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='sw-button-link h-auto px-1 py-0.5 text-xs'
                      >
                        <Download className='mr-1 h-3.5 w-3.5' />
                        Baixar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className='mt-4 text-center'>
            <p className='text-sw-text-tertiary text-xs'>
              Se precisar de comprovantes anteriores, entre em contato com o suporte.
            </p>
            <Button variant='link' className='sw-button-link mt-1 h-auto px-1 py-0.5 text-xs'>
              Suporte
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className='sw-card'>
        <CardHeader className='pb-4'>
          <CardTitle className='text-sw-text-primary text-lg font-semibold'>
            Dicas sobre Cobrança & Segurança
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 text-sm'>
          {[
            {
              icon: Shield,
              text: 'Seus dados bancários são criptografados e protegidos por parceiros de pagamento certificados.',
            },
            {
              icon: RefreshCw,
              text: 'Você pode trocar o cartão a qualquer momento. O novo cartão será usado nas próximas cobranças.',
            },
            {
              icon: Calendar,
              text: 'Todos os pagamentos são processados no início do ciclo. Caso não haja saldo, você será notificado por e-mail.',
            },
          ].map((tip, index) => (
            <div key={index} className='flex items-start gap-3'>
              <tip.icon className='text-sw-accent-purple mt-0.5 h-4 w-4 flex-shrink-0' />
              <p className='text-sw-text-secondary'>{tip.text}</p>
            </div>
          ))}
          <div className='flex items-start gap-3'>
            <Info className='text-sw-accent-purple mt-0.5 h-4 w-4 flex-shrink-0' />
            <p className='text-sw-text-secondary'>
              Em caso de dúvidas ou problemas, fale com o{' '}
              <Button variant='link' className='sw-button-link inline h-auto p-0 text-sm'>
                Suporte
              </Button>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
