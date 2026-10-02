import {
  address,
  appendTransactionMessageInstruction,
  assertIsTransactionMessageWithSingleSendingSigner,
  createTransactionMessage,
  getBase58Decoder,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signAndSendTransactionMessageWithSigners,
  signature,
  type Instruction,
} from '@solana/kit'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMobileWallet } from '@wallet-ui/react-native-kit'
import {
  confirmDailyCheckIn,
  getDailyCheckInStatus,
  requestDailyCheckIn,
} from '../../repositories/daily-checkin-repository'
import { waitForConfirmation } from '../../utils/wait-for-confirmation'
import { SEEKASE_SOLANA_CHAIN, SEEKASE_SOLANA_NETWORK_LABEL } from '../../data/solana-network'

const memoProgram = address('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')
const statusKey = ['daily-checkin'] as const

export function useDailyCheckIn() {
  const { account, chain, client, getTransactionSigner } = useMobileWallet()
  const queryClient = useQueryClient()
  const statusQuery = useQuery({
    queryKey: statusKey,
    queryFn: async () => {
      const result = await getDailyCheckInStatus()
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
  })

  const checkInMutation = useMutation({
    mutationFn: async () => {
      if (!account) throw new Error('Connect your verified Solana wallet before checking in.')
      if (chain !== SEEKASE_SOLANA_CHAIN) {
        throw new Error(`Switch the wallet to ${SEEKASE_SOLANA_NETWORK_LABEL} before checking in.`)
      }
      const prepared = await requestDailyCheckIn(account.address)
      if (!prepared.ok) throw new Error(prepared.error.message)
      const {
        context: { slot: minContextSlot },
        value: latestBlockhash,
      } = await client.rpc.getLatestBlockhash().send()
      const signer = getTransactionSigner(account.address, minContextSlot)
      const instruction: Instruction = {
        programAddress: memoProgram,
        data: new TextEncoder().encode(prepared.data.memo),
      }
      const transaction = pipe(
        createTransactionMessage({ version: 0 }),
        (message) => setTransactionMessageFeePayerSigner(signer, message),
        (message) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, message),
        (message) => appendTransactionMessageInstruction(instruction, message),
      )
      assertIsTransactionMessageWithSingleSendingSigner(transaction)
      const signatureBytes = await signAndSendTransactionMessageWithSigners(transaction)
      const transactionSignature = signature(getBase58Decoder().decode(signatureBytes))
      await waitForConfirmation(client.rpc, transactionSignature)
      const confirmed = await confirmDailyCheckIn({
        requestId: prepared.data.requestId,
        transactionSignature,
      })
      if (!confirmed.ok) throw new Error(confirmed.error.message)
      return confirmed.data
    },
    onSuccess: (status) => queryClient.setQueryData(statusKey, status),
    onSettled: () => queryClient.invalidateQueries({ queryKey: statusKey }),
  })

  return { statusQuery, checkInMutation }
}
